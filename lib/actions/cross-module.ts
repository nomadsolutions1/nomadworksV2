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

// ─── Fleet Cost Loader ──────────────────────────────────────
// v2 schema-reality (David's note V3-4):
// Weder `fuel_logs` noch `trip_logs` haben einen `site_id`-FK — sie sind
// auf Fahrzeugebene geloggt. `equipment_costs` ebenfalls nicht.
// Wir leiten Fleet-Kosten pro Baustelle deshalb über den aktuellen
// `assigned_site`-Zustand auf `equipment` ab (statische Zuweisung).
// Für Vehicles existiert kein `assigned_site` in v2 — `assigned_to` zeigt
// auf einen User, nicht auf eine Baustelle. Daher: vehicles tragen
// aktuell NICHT zu getSiteCosts bei (dokumentiert in phase-v3-4-report.md).
// Erweiterung auf trip_logs.site_id ist ein Backlog-Item (V3-5+).

async function loadFleetCost(db: DB, companyId: string, siteId: string): Promise<number> {
  // Aktuelle Equipment auf dieser Baustelle
  const { data: assignedEquip, error: eqErr } = await db
    .from("equipment")
    .select("id, daily_rate")
    .eq("company_id", companyId)
    .eq("assigned_site", siteId)
    .is("deleted_at", null)

  if (eqErr) {
    trackError("cross-module", "loadFleetCost.equipment", eqErr.message, { siteId })
    return 0
  }

  if (!assignedEquip || assignedEquip.length === 0) return 0

  const equipIds = assignedEquip.map((e) => e.id)

  // Tatsächliche gebuchte Equipment-Kosten
  const { data: costs, error: costErr } = await db
    .from("equipment_costs")
    .select("equipment_id, amount")
    .eq("company_id", companyId)
    .in("equipment_id", equipIds)

  if (costErr) {
    trackError("cross-module", "loadFleetCost.costs", costErr.message, { siteId })
    return 0
  }

  const actual = (costs ?? []).reduce((sum, c) => sum + (c.amount ?? 0), 0)
  return Math.round(actual * 100) / 100
}

// ─── getSiteCosts ────────────────────────────────────────────
// labor (time_entries) + material (stock_movements) + fleet (equipment_costs via assigned_site).
// subs bleibt Platzhalter (0) — V3-5 (Subunternehmer).

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

    const [labor, material, fleet] = await Promise.all([
      loadLaborCost(db, profile.company_id, siteId),
      loadMaterialCost(db, profile.company_id, siteId),
      loadFleetCost(db, profile.company_id, siteId),
    ])

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

// ─── getVehicleUtilization ───────────────────────────────────
// Aggregates trip + fuel + equipment cost activity per vehicle.
// Architektur-Doc Use Case #5: Einsatztage / km / Kosten pro Fahrzeug.

export type VehicleUtilizationRow = {
  vehicle_id: string
  license_plate: string
  make: string
  model: string
  total_km: number
  trip_count: number
  active_days: number
  fuel_cost: number
  fuel_liters: number
}

export type VehicleUtilizationParams = {
  vehicleId?: string
  range?: { from: string; to: string }
}

export async function getVehicleUtilization(
  params: VehicleUtilizationParams = {}
): Promise<{ data?: VehicleUtilizationRow[]; error?: string }> {
  return withAuth(null, "read", async ({ profile, db }) => {
    let vehQuery = db
      .from("vehicles")
      .select("id, license_plate, make, model")
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)

    if (params.vehicleId) vehQuery = vehQuery.eq("id", params.vehicleId)

    const { data: vehicles, error: vErr } = await vehQuery
    if (vErr) {
      trackError("cross-module", "getVehicleUtilization.vehicles", vErr.message)
      return { error: "Fahrzeuge konnten nicht geladen werden" }
    }
    if (!vehicles || vehicles.length === 0) return { data: [] }

    const vehicleIds = vehicles.map((v) => v.id)

    // Parallel loaders — no sequential fetches
    let tripQuery = db
      .from("trip_logs")
      .select("vehicle_id, km, date")
      .eq("company_id", profile.company_id)
      .in("vehicle_id", vehicleIds)

    let fuelQuery = db
      .from("fuel_logs")
      .select("vehicle_id, liters, cost, date")
      .eq("company_id", profile.company_id)
      .in("vehicle_id", vehicleIds)

    if (params.range?.from) {
      tripQuery = tripQuery.gte("date", params.range.from)
      fuelQuery = fuelQuery.gte("date", params.range.from)
    }
    if (params.range?.to) {
      tripQuery = tripQuery.lte("date", params.range.to)
      fuelQuery = fuelQuery.lte("date", params.range.to)
    }

    const [tripsRes, fuelRes] = await Promise.all([tripQuery, fuelQuery])

    if (tripsRes.error) {
      trackError("cross-module", "getVehicleUtilization.trips", tripsRes.error.message)
      return { error: "Fahrten konnten nicht geladen werden" }
    }
    if (fuelRes.error) {
      trackError("cross-module", "getVehicleUtilization.fuel", fuelRes.error.message)
      return { error: "Tankbuch konnte nicht geladen werden" }
    }

    const trips = tripsRes.data ?? []
    const fuelEntries = fuelRes.data ?? []

    // Aggregate per vehicle
    const rows: VehicleUtilizationRow[] = vehicles.map((v) => {
      const vTrips = trips.filter((t) => t.vehicle_id === v.id)
      const vFuel = fuelEntries.filter((f) => f.vehicle_id === v.id)

      const uniqueDays = new Set<string>()
      let totalKm = 0
      for (const t of vTrips) {
        totalKm += t.km ?? 0
        if (t.date) uniqueDays.add(t.date)
      }
      for (const f of vFuel) {
        if (f.date) uniqueDays.add(f.date)
      }

      const fuelCost = vFuel.reduce((s, f) => s + (f.cost ?? 0), 0)
      const fuelLiters = vFuel.reduce((s, f) => s + (f.liters ?? 0), 0)

      return {
        vehicle_id: v.id,
        license_plate: v.license_plate,
        make: v.make,
        model: v.model,
        total_km: Math.round(totalKm * 100) / 100,
        trip_count: vTrips.length,
        active_days: uniqueDays.size,
        fuel_cost: Math.round(fuelCost * 100) / 100,
        fuel_liters: Math.round(fuelLiters * 100) / 100,
      }
    })

    return { data: rows.sort((a, b) => b.total_km - a.total_km) }
  }) as Promise<{ data?: VehicleUtilizationRow[]; error?: string }>
}

// ─── getTuvWarnings ──────────────────────────────────────────
// Fahrzeuge mit TÜV fällig innerhalb der nächsten `days` Tage (inkl. überfällig).
// Teil der getActiveWarnings-Use-Case aus cross-module-architecture.md.

export type TuvWarning = {
  vehicle_id: string
  license_plate: string
  make: string
  model: string
  next_inspection: string
  days_until: number
  severity: "overdue" | "critical" | "warning"
}

export async function getTuvWarnings(
  days: number = 30
): Promise<{ data?: TuvWarning[]; error?: string }> {
  return withAuth(null, "read", async ({ profile, db }) => {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    const horizon = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    const { data, error } = await db
      .from("vehicles")
      .select("id, license_plate, make, model, next_inspection")
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .not("next_inspection", "is", null)
      .lte("next_inspection", horizon)
      .order("next_inspection", { ascending: true })

    if (error) {
      trackError("cross-module", "getTuvWarnings", error.message)
      return { error: "TÜV-Warnungen konnten nicht geladen werden" }
    }

    const warnings: TuvWarning[] = (data ?? [])
      .filter((v) => v.next_inspection)
      .map((v) => {
        const inspection = v.next_inspection as string
        const diffDays = Math.floor(
          (new Date(inspection).getTime() - new Date(todayStr).getTime()) / 86400000
        )
        const severity: TuvWarning["severity"] =
          diffDays < 0 ? "overdue" : diffDays <= 7 ? "critical" : "warning"
        return {
          vehicle_id: v.id,
          license_plate: v.license_plate,
          make: v.make,
          model: v.model,
          next_inspection: inspection,
          days_until: diffDays,
          severity,
        }
      })

    return { data: warnings }
  }) as Promise<{ data?: TuvWarning[]; error?: string }>
}
