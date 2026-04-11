"use server"

import { withAuth } from "@/lib/utils/auth-helper"
import { trackError } from "@/lib/utils/error-tracker"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database"

type DB = SupabaseClient<Database>

// ─── Types ────────────────────────────────────────────────────

export type SiteCostBreakdown = {
  labor: number
  material: number
  fleet: number
  subs: number
  total: number
  currency: "EUR"
}

export type MaterialUsageRow = {
  site_id: string
  site_name: string
  material_id: string
  material_name: string
  quantity: number
  total_cost: number
  last_movement: string
}

export type MaterialUsageParams = {
  materialId?: string
  siteId?: string
  range?: { from: string; to: string }
}

// ─── Pure aggregation helpers ────────────────────────────────

function computeLaborCost(
  entries: Array<{ user_id: string; clock_in: string; clock_out: string | null; break_minutes: number | null }>,
  rateMap: Map<string, number>
): number {
  let total = 0
  for (const e of entries) {
    if (!e.clock_out) continue
    const rate = rateMap.get(e.user_id)
    if (!rate) continue
    const hours = Math.max(
      0,
      (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 -
        (e.break_minutes ?? 0) / 60
    )
    total += hours * rate
  }
  return Math.round(total * 100) / 100
}

function computeMaterialCost(
  movements: Array<{ material_id: string; quantity: number; unit_price: number | null }>,
  priceMap: Map<string, number>
): number {
  let total = 0
  for (const m of movements) {
    const price = m.unit_price ?? priceMap.get(m.material_id) ?? 0
    total += (m.quantity ?? 0) * price
  }
  return Math.round(total * 100) / 100
}

// ─── Parallel loaders (scoped by company_id) ────────────────

async function loadLaborCost(db: DB, companyId: string, siteId: string): Promise<number> {
  const [timeRes, rateRes] = await Promise.all([
    db
      .from("time_entries")
      .select("user_id, clock_in, clock_out, break_minutes")
      .eq("site_id", siteId)
      .eq("company_id", companyId)
      .not("clock_out", "is", null),
    db
      .from("profiles")
      .select("id, hourly_rate")
      .eq("company_id", companyId)
      .not("hourly_rate", "is", null),
  ])

  if (timeRes.error) {
    trackError("cross-module", "loadLaborCost.time", timeRes.error.message, { siteId })
    return 0
  }

  const rateMap = new Map<string, number>()
  for (const r of rateRes.data ?? []) {
    if (r.hourly_rate != null) rateMap.set(r.id, Number(r.hourly_rate))
  }

  return computeLaborCost(timeRes.data ?? [], rateMap)
}

async function loadMaterialCost(db: DB, companyId: string, siteId: string): Promise<number> {
  const [moveRes, matRes] = await Promise.all([
    db
      .from("stock_movements")
      .select("material_id, quantity, unit_price")
      .eq("site_id", siteId)
      .eq("company_id", companyId)
      .eq("type", "out"),
    db
      .from("materials")
      .select("id, price_per_unit")
      .eq("company_id", companyId)
      .not("price_per_unit", "is", null),
  ])

  if (moveRes.error) {
    trackError("cross-module", "loadMaterialCost.movements", moveRes.error.message, { siteId })
    return 0
  }

  const priceMap = new Map<string, number>()
  for (const m of matRes.data ?? []) {
    if (m.price_per_unit != null) priceMap.set(m.id, Number(m.price_per_unit))
  }

  return computeMaterialCost(moveRes.data ?? [], priceMap)
}

// ─── getSiteCosts ────────────────────────────────────────────
// Nur labor (time_entries) + material (stock_movements) werden aktuell summiert.
// fleet + subs sind Platzhalter (0) — implementiert in V3-4 / V3-5.

export async function getSiteCosts(
  siteId: string
): Promise<{ data?: SiteCostBreakdown; error?: string }> {
  return withAuth(null, "read", async ({ profile, db }) => {
    // Verify site belongs to company — single guard, rest of queries are scoped
    const { data: site } = await db
      .from("construction_sites")
      .select("id")
      .eq("id", siteId)
      .eq("company_id", profile.company_id)
      .single()

    if (!site) return { error: "Baustelle nicht gefunden" }

    const [labor, material] = await Promise.all([
      loadLaborCost(db, profile.company_id, siteId),
      loadMaterialCost(db, profile.company_id, siteId),
    ])

    const fleet = 0
    const subs = 0
    const total = Math.round((labor + material + fleet + subs) * 100) / 100

    return {
      data: { labor, material, fleet, subs, total, currency: "EUR" as const },
    }
  }) as Promise<{ data?: SiteCostBreakdown; error?: string }>
}

// ─── getMaterialUsage ────────────────────────────────────────

export async function getMaterialUsage(
  params: MaterialUsageParams = {}
): Promise<{ data?: MaterialUsageRow[]; error?: string }> {
  return withAuth(null, "read", async ({ profile, db }) => {
    let query = db
      .from("stock_movements")
      .select(
        "material_id, site_id, quantity, unit_price, created_at, materials(name, price_per_unit), construction_sites(name)"
      )
      .eq("company_id", profile.company_id)
      .eq("type", "out")
      .not("site_id", "is", null)
      .not("material_id", "is", null)

    if (params.materialId) query = query.eq("material_id", params.materialId)
    if (params.siteId) query = query.eq("site_id", params.siteId)
    if (params.range?.from) query = query.gte("created_at", params.range.from)
    if (params.range?.to) query = query.lte("created_at", params.range.to)

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      trackError("cross-module", "getMaterialUsage", error.message, { table: "stock_movements" })
      return { error: error.message }
    }

    // Aggregate by (site_id, material_id)
    type Row = {
      material_id: string | null
      site_id: string | null
      quantity: number
      unit_price: number | null
      created_at: string
      materials: { name: string; price_per_unit: number | null } | null
      construction_sites: { name: string } | null
    }

    const buckets = new Map<string, MaterialUsageRow>()
    for (const row of (data ?? []) as Row[]) {
      if (!row.material_id || !row.site_id) continue
      const key = `${row.site_id}::${row.material_id}`
      const unitPrice = row.unit_price ?? row.materials?.price_per_unit ?? 0
      const lineCost = (row.quantity ?? 0) * unitPrice
      const existing = buckets.get(key)
      if (existing) {
        existing.quantity += row.quantity ?? 0
        existing.total_cost += lineCost
        if (row.created_at > existing.last_movement) existing.last_movement = row.created_at
      } else {
        buckets.set(key, {
          site_id: row.site_id,
          site_name: row.construction_sites?.name ?? "Unbekannt",
          material_id: row.material_id,
          material_name: row.materials?.name ?? "Unbekannt",
          quantity: row.quantity ?? 0,
          total_cost: lineCost,
          last_movement: row.created_at,
        })
      }
    }

    const result = Array.from(buckets.values())
      .map((r) => ({
        ...r,
        quantity: Math.round(r.quantity * 100) / 100,
        total_cost: Math.round(r.total_cost * 100) / 100,
      }))
      .sort((a, b) => (a.last_movement < b.last_movement ? 1 : -1))

    return { data: result }
  }) as Promise<{ data?: MaterialUsageRow[]; error?: string }>
}
