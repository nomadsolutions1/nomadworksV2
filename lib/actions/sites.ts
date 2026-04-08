"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"
import { logActivity } from "@/lib/utils/activity-logger"
import { withAuth } from "@/lib/utils/auth-helper"
import { buildProfileNameMap } from "@/lib/utils/shared-queries"

// ─── Types ────────────────────────────────────────────────────

export type SiteStatus = "active" | "paused" | "completed"

export type Site = {
  id: string
  company_id: string
  name: string
  order_id: string | null
  address: string | null
  status: SiteStatus
  description: string | null
  client_name: string | null
  client_phone: string | null
  client_email: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  site_manager: string | null
  site_manager_name: string | null
  notes: string | null
  latitude: number | null
  longitude: number | null
  qr_code: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_role: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type SiteStats = {
  timeEntriesCount: number
  totalHours: number
  equipmentCount: number
  materialsCount: number
  diaryEntriesCount: number
}

export type SiteForeman = {
  id: string
  name: string
}

export type SiteCosts = {
  personalCosts: number
  materialCosts: number
  equipmentCosts: number
  vehicleCosts: number
  subcontractorCosts: number
  totalCosts: number
  budget: number | null
  budgetUsedPercent: number
  costBreakdown: {
    category: string
    amount: number
    percentage: number
  }[]
}

export type SiteTimeEntry = {
  id: string
  user_name: string
  date: string
  clock_in: string
  clock_out: string | null
  break_minutes: number
  total_hours: number
}

export type SiteTeamMember = {
  userId: string
  name: string
  jobTitle: string | null
  totalHours: number
  totalCosts: number
}

export type SiteMeasurement = {
  id: string
  description: string
  length: number | null
  width: number | null
  height: number | null
  unit: string
  quantity: number
  calculated_value: number | null
  notes: string | null
  measured_at: string
}

// ─── Zod Schemas ──────────────────────────────────────────────

const siteSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  order_id: z.string().uuid("Bitte wählen Sie einen Auftrag aus").optional().or(z.literal("")),
  address: z.string().optional(),
  street: z.string().optional().transform((v) => v || null),
  zip: z.string().optional().transform((v) => v || null),
  city: z.string().optional().transform((v) => v || null),
  country: z.string().optional().transform((v) => v || null),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "completed"]).default("active"),
  budget: z.string().optional().transform((v) => (v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null)),
  start_date: z.string().optional().transform((v) => v || null),
  end_date: z.string().optional().transform((v) => v || null),
  client_name: z.string().optional(),
  client_phone: z.string().optional(),
  client_email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  site_manager: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
  notes: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_role: z.string().optional(),
})

// ─── getSites ─────────────────────────────────────────────────

export async function getSites(): Promise<{ data?: Site[]; error?: string }> {
  return withAuth("baustellen", "read", async ({ profile, db }) => {
    const { data: sites, error } = await db.from("construction_sites")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })

    if (error) {
      trackError("sites", "getSites", error.message, { table: "construction_sites" })
      return { error: error.message }
    }

    const siteList = sites ?? []
    if (siteList.length === 0) return { data: [] }

    // Get site manager names via shared utility
    const managerIds = [...new Set(
      siteList.filter((s) => s.site_manager).map((s) => s.site_manager as string)
    )]

    const profileMap = managerIds.length > 0
      ? await buildProfileNameMap(db, profile.company_id, managerIds)
      : new Map<string, string>()

    return {
      data: siteList.map((s) => ({
        id: s.id,
        company_id: s.company_id,
        name: s.name,
        order_id: s.order_id ?? null,
        address: s.address ?? null,
        status: s.status as SiteStatus,
        description: s.description ?? null,
        client_name: s.client_name ?? null,
        client_phone: s.client_phone ?? null,
        client_email: s.client_email ?? null,
        start_date: s.start_date ?? null,
        end_date: s.end_date ?? null,
        budget: s.budget != null ? Number(s.budget) : null,
        site_manager: s.site_manager ?? null,
        site_manager_name: s.site_manager ? profileMap.get(s.site_manager) ?? null : null,
        notes: s.notes ?? null,
        latitude: s.latitude != null ? Number(s.latitude) : null,
        longitude: s.longitude != null ? Number(s.longitude) : null,
        qr_code: s.qr_code ?? null,
        contact_name: s.contact_name ?? null,
        contact_phone: s.contact_phone ?? null,
        contact_role: s.contact_role ?? null,
        created_by: s.created_by,
        created_at: s.created_at,
        updated_at: s.updated_at,
      })),
    }
  }) as Promise<{ data?: Site[]; error?: string }>
}

// ─── getSite ──────────────────────────────────────────────────

export async function getSite(id: string): Promise<{ data?: Site; error?: string }> {
  return withAuth("baustellen", "read", async ({ profile, db }) => {
    const { data: site, error } = await db.from("construction_sites")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error || !site) {
      trackError("sites", "getSite", error?.message || "Baustelle nicht gefunden", { table: "construction_sites" })
      return { error: "Baustelle nicht gefunden" }
    }

    let site_manager_name: string | null = null
    if (site.site_manager) {
      const { data: managerProfile } = await db.from("profiles")
        .select("first_name, last_name")
        .eq("id", site.site_manager)
        .single()
      if (managerProfile) {
        site_manager_name = `${managerProfile.first_name} ${managerProfile.last_name}`
      }
    }

    return {
      data: {
        id: site.id,
        company_id: site.company_id,
        name: site.name,
        order_id: site.order_id ?? null,
        address: site.address ?? null,
        status: site.status as SiteStatus,
        description: site.description ?? null,
        client_name: site.client_name ?? null,
        client_phone: site.client_phone ?? null,
        client_email: site.client_email ?? null,
        start_date: site.start_date ?? null,
        end_date: site.end_date ?? null,
        budget: site.budget != null ? Number(site.budget) : null,
        site_manager: site.site_manager ?? null,
        site_manager_name,
        notes: site.notes ?? null,
        latitude: site.latitude != null ? Number(site.latitude) : null,
        longitude: site.longitude != null ? Number(site.longitude) : null,
        qr_code: site.qr_code ?? null,
        contact_name: site.contact_name ?? null,
        contact_phone: site.contact_phone ?? null,
        contact_role: site.contact_role ?? null,
        created_by: site.created_by,
        created_at: site.created_at,
        updated_at: site.updated_at,
      },
    }
  }) as Promise<{ data?: Site; error?: string }>
}

// ─── getSiteStats ─────────────────────────────────────────────

export async function getSiteStats(siteId: string): Promise<{ data?: SiteStats; error?: string }> {
  return withAuth("baustellen", "read", async ({ profile, db }) => {
    const [timeRes, diaryRes, equipRes, movementRes] = await Promise.all([
      db.from("time_entries")
        .select("id, clock_in, clock_out, break_minutes")
        .eq("site_id", siteId)
        .eq("company_id", profile.company_id),
      db.from("diary_entries")
        .select("id", { count: "exact" })
        .eq("site_id", siteId)
        .eq("company_id", profile.company_id),
      db.from("equipment")
        .select("id", { count: "exact", head: true })
        .eq("assigned_site", siteId)
        .eq("company_id", profile.company_id),
      db.from("stock_movements")
        .select("id", { count: "exact", head: true })
        .eq("site_id", siteId)
        .eq("company_id", profile.company_id),
    ])

    const timeEntries = timeRes.data ?? []
    let totalMinutes = 0
    for (const entry of timeEntries) {
      if (!entry.clock_out) continue
      const clockIn = new Date(entry.clock_in)
      const clockOut = new Date(entry.clock_out)
      const minutes = (clockOut.getTime() - clockIn.getTime()) / 60000 - (entry.break_minutes ?? 0)
      totalMinutes += Math.max(0, minutes)
    }

    return {
      data: {
        timeEntriesCount: timeEntries.length,
        totalHours: Math.round(totalMinutes / 60),
        equipmentCount: equipRes.count ?? 0,
        materialsCount: movementRes.count ?? 0,
        diaryEntriesCount: (diaryRes.data ?? []).length,
      },
    }
  }) as Promise<{ data?: SiteStats; error?: string }>
}

// ─── getForemanList ───────────────────────────────────────────

export async function getForemanList(): Promise<{ data?: SiteForeman[]; error?: string }> {
  return withAuth("baustellen", "read", async ({ profile, db }) => {
    const { data: profiles, error } = await db.from("profiles")
      .select("id, first_name, last_name, role")
      .in("role", ["foreman", "owner"])
      .eq("company_id", profile.company_id)
      .order("first_name", { ascending: true })

    if (error) {
      trackError("sites", "getForemanList", error.message, { table: "profiles" })
      return { error: error.message }
    }

    return {
      data: (profiles ?? []).map((p) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
      })),
    }
  }) as Promise<{ data?: SiteForeman[]; error?: string }>
}

// ─── createSite ───────────────────────────────────────────────

export async function createSite(formData: FormData): Promise<{ success?: boolean; id?: string; error?: string | unknown }> {
  return withAuth("baustellen", "write", async ({ user, profile, db }) => {
    const validated = siteSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten() }

    const { name, order_id, address, street, zip, city, country, description, status, budget, start_date, end_date,
      client_name, client_phone, client_email, site_manager, notes,
      contact_name, contact_phone, contact_role } = validated.data

    // Build combined address for backward compatibility
    const combinedAddress = [street, zip && city ? `${zip} ${city}` : zip || city, country !== "Deutschland" ? country : null]
      .filter(Boolean).join(", ") || address || null

    // Some fields exist in DB but not in strict generated Insert types — assert until types regenerated
    const { data: site, error } = await db.from("construction_sites").insert({
      company_id: profile.company_id,
      name,
      order_id: order_id || null,
      address: combinedAddress,
      street: street || null,
      zip: zip || null,
      city: city || null,
      country: country || "Deutschland",
      description: description || null,
      status,
      budget: budget ?? null,
      start_date: start_date || null,
      end_date: end_date || null,
      client_name: client_name || null,
      client_phone: client_phone || null,
      client_email: client_email || null,
      site_manager: site_manager || null,
      notes: notes || null,
      contact_name: contact_name || null,
      contact_phone: contact_phone || null,
      contact_role: contact_role || null,
      created_by: user.id,
    } as never).select("id").single()

    if (error) {
      trackError("sites", "createSite", error.message, { table: "construction_sites" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "site",
      entityId: site.id,
      title: `Baustelle "${name}" angelegt`,
    })

    revalidatePath("/baustellen")
    return { success: true, id: site.id }
  }) as Promise<{ success?: boolean; id?: string; error?: string | unknown }>
}

// ─── updateSite ───────────────────────────────────────────────

export async function updateSite(id: string, formData: FormData): Promise<{ success?: boolean; error?: string | unknown }> {
  return withAuth("baustellen", "write", async ({ user, profile, db }) => {
    const validated = siteSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten() }

    const { name, address, description, status, budget, start_date, end_date,
      client_name, client_phone, client_email, site_manager, notes,
      contact_name, contact_phone, contact_role } = validated.data

    const { error } = await db.from("construction_sites").update({
      name,
      address: address || null,
      description: description || null,
      status,
      budget: budget ?? null,
      start_date: start_date || null,
      end_date: end_date || null,
      client_name: client_name || null,
      client_phone: client_phone || null,
      client_email: client_email || null,
      site_manager: site_manager || null,
      notes: notes || null,
      contact_name: contact_name || null,
      contact_phone: contact_phone || null,
      contact_role: contact_role || null,
      updated_at: new Date().toISOString(),
    }).eq("id", id).eq("company_id", profile.company_id)

    if (error) {
      trackError("sites", "updateSite", error.message, { table: "construction_sites" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "site",
      entityId: id,
      title: `Baustelle "${name}" aktualisiert`,
    })

    revalidatePath("/baustellen")
    revalidatePath(`/baustellen/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | unknown }>
}

// ─── deleteSite ───────────────────────────────────────────────

export async function deleteSite(id: string): Promise<{ success?: boolean; error?: string }> {
  return withAuth("baustellen", "write", async ({ user, profile, db }) => {
    if (profile.role !== "owner") {
      return { error: "Keine Berechtigung" }
    }

    // Get name for activity log
    const { data: site } = await db.from("construction_sites")
      .select("name")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    const { error } = await db.from("construction_sites")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("sites", "deleteSite", error.message, { table: "construction_sites" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "site",
      entityId: id,
      title: site ? `Baustelle "${site.name}" gelöscht` : `Baustelle gelöscht`,
    })

    revalidatePath("/baustellen")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── getTimeEntriesForSite ────────────────────────────────────

export async function getTimeEntriesForSite(siteId: string): Promise<{ data?: SiteTimeEntry[]; error?: string }> {
  return withAuth("baustellen", "read", async ({ profile, db }) => {
    const { data: entries, error } = await db.from("time_entries")
      .select("id, user_id, clock_in, clock_out, break_minutes")
      .eq("site_id", siteId)
      .eq("company_id", profile.company_id)
      .order("clock_in", { ascending: false })

    if (error) {
      trackError("sites", "getTimeEntriesForSite", error.message, { table: "time_entries" })
      return { error: error.message }
    }

    const timeEntries = entries ?? []
    if (timeEntries.length === 0) return { data: [] }

    // Get user names via shared utility
    const userIds = [...new Set(timeEntries.map((t) => t.user_id))]
    const profileMap = await buildProfileNameMap(db, profile.company_id, userIds)

    return {
      data: timeEntries.map((t) => {
        const clockIn = new Date(t.clock_in)
        const clockOut = t.clock_out ? new Date(t.clock_out) : null
        const breakMin = t.break_minutes ?? 0
        const totalMin = clockOut
          ? Math.max(0, (clockOut.getTime() - clockIn.getTime()) / 60000 - breakMin)
          : 0

        return {
          id: t.id,
          user_name: profileMap.get(t.user_id) || "Unbekannt",
          date: clockIn.toISOString().split("T")[0],
          clock_in: t.clock_in,
          clock_out: t.clock_out,
          break_minutes: breakMin,
          total_hours: Math.round((totalMin / 60) * 10) / 10,
        }
      }),
    }
  }) as Promise<{ data?: SiteTimeEntry[]; error?: string }>
}

// ─── getSiteCosts (ECHTE Kosten — kein hardcoded 0) ──────────

export async function getSiteCosts(siteId: string): Promise<{ data?: SiteCosts; error?: string }> {
  return withAuth("baustellen", "read", async ({ profile, db }) => {
    // 1. Personal costs: time_entries x hourly_rate
    const [timeRes, rateRes] = await Promise.all([
      db.from("time_entries")
        .select("user_id, clock_in, clock_out, break_minutes")
        .eq("site_id", siteId)
        .eq("company_id", profile.company_id)
        .not("clock_out", "is", null),
      db.from("profiles")
        .select("id, hourly_rate")
        .eq("company_id", profile.company_id)
        .not("hourly_rate", "is", null),
    ])

    const rateMap = new Map<string, number>()
    for (const r of rateRes.data ?? []) {
      rateMap.set(r.id, r.hourly_rate ?? 0)
    }

    let personalCosts = 0
    for (const e of timeRes.data ?? []) {
      const rate = rateMap.get(e.user_id)
      if (!rate || !e.clock_out) continue
      const hours = Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - (e.break_minutes ?? 0) / 60)
      personalCosts += hours * rate
    }

    // 2. Material costs: stock_movements (type=out) x price_per_unit
    const [movementRes, materialRes] = await Promise.all([
      db.from("stock_movements")
        .select("material_id, quantity")
        .eq("site_id", siteId)
        .eq("company_id", profile.company_id)
        .eq("type", "out"),
      db.from("materials")
        .select("id, price_per_unit")
        .eq("company_id", profile.company_id)
        .not("price_per_unit", "is", null),
    ])

    const priceMap = new Map<string, number>()
    for (const m of materialRes.data ?? []) {
      priceMap.set(m.id, m.price_per_unit ?? 0)
    }

    let materialCosts = 0
    for (const m of movementRes.data ?? []) {
      const price = priceMap.get(m.material_id)
      if (!price) continue
      materialCosts += (m.quantity ?? 0) * price
    }

    // 3. Equipment + Vehicle costs from asset_assignments
    // Note: asset_assignments may not be in generated types yet
    let equipmentCosts = 0
    let vehicleCosts = 0
    try {
      const { data: assetData } = await (db.from as (table: string) => ReturnType<typeof db.from>)("asset_assignments")
        .select("asset_type, daily_rate, assigned_from, assigned_to")
        .eq("site_id", siteId)
        .eq("company_id", profile.company_id)

      const today = new Date()
      for (const a of assetData ?? []) {
        const row = a as { asset_type: string; daily_rate: number | null; assigned_from: string; assigned_to: string | null }
        const rate = row.daily_rate
        if (!rate) continue
        const from = new Date(row.assigned_from)
        const to = row.assigned_to ? new Date(row.assigned_to) : today
        const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000))
        const cost = rate * days
        if (row.asset_type === "equipment") equipmentCosts += cost
        else vehicleCosts += cost
      }
    } catch {
      // asset_assignments table may not exist yet
    }

    // 4. Subcontractor costs — proportionally allocated across sites sharing the same order
    let subcontractorCosts = 0
    const { data: siteOrderData } = await db
      .from("construction_sites")
      .select("order_id, budget")
      .eq("id", siteId)
      .eq("company_id", profile.company_id)
      .single()

    const siteOrderId = siteOrderData?.order_id ?? null

    if (siteOrderId) {
      const [assignRes, siblingSitesRes] = await Promise.all([
        db.from("subcontractor_assignments")
          .select("invoiced_amount, agreed_amount")
          .eq("order_id", siteOrderId)
          .eq("company_id", profile.company_id),
        db.from("construction_sites")
          .select("id, budget")
          .eq("order_id", siteOrderId)
          .eq("company_id", profile.company_id),
      ])

      let totalSubCost = 0
      for (const a of assignRes.data ?? []) {
        totalSubCost += (a.invoiced_amount as number) || (a.agreed_amount as number) || 0
      }

      // Proportional allocation: by budget share if budgets exist, otherwise equal split
      const siblings = siblingSitesRes.data ?? []
      if (siblings.length > 0 && totalSubCost > 0) {
        const totalBudgetAllSites = siblings.reduce((s, si) => s + (Number(si.budget) || 0), 0)
        const siteBudget = Number(siteOrderData?.budget) || 0

        if (totalBudgetAllSites > 0 && siteBudget > 0) {
          // Weighted by budget proportion
          subcontractorCosts = totalSubCost * (siteBudget / totalBudgetAllSites)
        } else {
          // Equal split across all sites
          subcontractorCosts = totalSubCost / siblings.length
        }
      }
    }

    // 5. Budget from site
    const { data: siteData } = await db
      .from("construction_sites")
      .select("budget")
      .eq("id", siteId)
      .eq("company_id", profile.company_id)
      .single()

    const budget = siteData?.budget != null ? Number(siteData.budget) : null

    const totalCosts = Math.round((personalCosts + materialCosts + equipmentCosts + vehicleCosts + subcontractorCosts) * 100) / 100
    const budgetUsedPercent = budget && budget > 0 ? Math.round((totalCosts / budget) * 1000) / 10 : 0

    // Build breakdown
    const breakdown = [
      { category: "Personal", amount: Math.round(personalCosts * 100) / 100 },
      { category: "Material", amount: Math.round(materialCosts * 100) / 100 },
      { category: "Geräte", amount: Math.round(equipmentCosts * 100) / 100 },
      { category: "Fahrzeuge", amount: Math.round(vehicleCosts * 100) / 100 },
      { category: "Subunternehmer", amount: Math.round(subcontractorCosts * 100) / 100 },
    ]
    const costBreakdown = breakdown.map((b) => ({
      ...b,
      percentage: totalCosts > 0 ? Math.round((b.amount / totalCosts) * 1000) / 10 : 0,
    }))

    return {
      data: {
        personalCosts: Math.round(personalCosts * 100) / 100,
        materialCosts: Math.round(materialCosts * 100) / 100,
        equipmentCosts: Math.round(equipmentCosts * 100) / 100,
        vehicleCosts: Math.round(vehicleCosts * 100) / 100,
        subcontractorCosts: Math.round(subcontractorCosts * 100) / 100,
        totalCosts,
        budget,
        budgetUsedPercent,
        costBreakdown,
      },
    }
  }) as Promise<{ data?: SiteCosts; error?: string }>
}

// ─── getSiteTeam ─────────────────────────────────────────────

export async function getSiteTeam(siteId: string): Promise<{ data?: SiteTeamMember[]; error?: string }> {
  return withAuth("baustellen", "read", async ({ profile, db }) => {
    const [timeRes, profileRes] = await Promise.all([
      db.from("time_entries")
        .select("user_id, clock_in, clock_out, break_minutes")
        .eq("site_id", siteId)
        .eq("company_id", profile.company_id)
        .not("clock_out", "is", null),
      db.from("profiles")
        .select("id, first_name, last_name, job_title, hourly_rate")
        .eq("company_id", profile.company_id),
    ])

    const profileMap = new Map<string, { name: string; jobTitle: string | null; rate: number }>()
    for (const p of profileRes.data ?? []) {
      profileMap.set(p.id, {
        name: `${p.first_name} ${p.last_name}`,
        jobTitle: p.job_title ?? null,
        rate: p.hourly_rate ?? 0,
      })
    }

    const byUser = new Map<string, { hours: number }>()
    for (const e of timeRes.data ?? []) {
      if (!e.clock_out) continue
      const hours = Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - (e.break_minutes ?? 0) / 60)
      const existing = byUser.get(e.user_id) || { hours: 0 }
      existing.hours += hours
      byUser.set(e.user_id, existing)
    }

    const team: SiteTeamMember[] = []
    for (const [uid, { hours }] of byUser) {
      const p = profileMap.get(uid)
      if (!p) continue
      team.push({
        userId: uid,
        name: p.name,
        jobTitle: p.jobTitle,
        totalHours: Math.round(hours * 10) / 10,
        totalCosts: Math.round(hours * p.rate * 100) / 100,
      })
    }

    team.sort((a, b) => b.totalHours - a.totalHours)
    return { data: team }
  }) as Promise<{ data?: SiteTeamMember[]; error?: string }>
}

// ─── Site Measurements (Aufmaß) ──────────────────────────────

export async function getSiteMeasurements(siteId: string): Promise<{ data?: SiteMeasurement[]; error?: string }> {
  return withAuth("baustellen", "read", async ({ profile, db }) => {
    const { data, error } = await db.from("measurements")
      .select("id, description, length, width, height, unit, quantity, calculated_value, notes, measured_at")
      .eq("site_id", siteId)
      .eq("company_id", profile.company_id)
      .order("measured_at", { ascending: false })

    if (error) {
      trackError("sites", "getSiteMeasurements", error.message, { table: "measurements" })
      return { error: error.message }
    }
    return { data: (data as SiteMeasurement[]) || [] }
  }) as Promise<{ data?: SiteMeasurement[]; error?: string }>
}
