"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"
import { logActivity } from "@/lib/utils/activity-logger"
import { withAuth } from "@/lib/utils/auth-helper"
import { getSurchargeType } from "@/lib/utils/dates"
import { buildProfileNameMap, buildSiteNameMap } from "@/lib/utils/shared-queries"
import type { SurchargeType } from "@/lib/utils/dates"

// ─── Types ────────────────────────────────────────────────────

export type TimeEntry = {
  id: string
  company_id: string
  user_id: string
  user_name: string
  site_id: string
  site_name: string
  clock_in: string
  clock_out: string | null
  clock_in_lat: number | null
  clock_in_lng: number | null
  clock_out_lat: number | null
  clock_out_lng: number | null
  break_minutes: number
  notes: string | null
  edited_by: string | null
  edited_at: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
  // Computed
  total_minutes: number
  total_hours: number
  surcharge: SurchargeType
}

export type OpenTimeEntry = {
  id: string
  site_id: string
  site_name: string
  clock_in: string
  notes: string | null
}

export type AssignedSiteInfo = {
  site_id: string
  site_name: string
  site_address: string | null
  shift_type: string | null
  notes: string | null
  foreman_name: string | null
  foreman_phone: string | null
}

// ─── Zod Schemas ──────────────────────────────────────────────

const clockInSchema = z.object({
  site_id: z.string().uuid("Bitte eine Baustelle auswählen"),
  lat: z.string().optional().transform((v) => (v ? parseFloat(v) : null)),
  lng: z.string().optional().transform((v) => (v ? parseFloat(v) : null)),
  notes: z.string().optional().transform((v) => v || null),
})

const clockOutSchema = z.object({
  lat: z.string().optional().transform((v) => (v ? parseFloat(v) : null)),
  lng: z.string().optional().transform((v) => (v ? parseFloat(v) : null)),
  break_minutes: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 0)),
  notes: z.string().optional().transform((v) => v || null),
})

const correctTimeEntrySchema = z.object({
  clock_in: z.string().min(1, "Beginn ist erforderlich"),
  clock_out: z.string().optional().transform((v) => v || null),
  break_minutes: z.coerce.number().min(0).default(0),
  site_id: z.string().uuid("Bitte eine Baustelle auswählen"),
  notes: z.string().optional().transform((v) => v || null),
})

// ─── Helpers ──────────────────────────────────────────────────

function buildTimeEntry(
  row: {
    id: string
    company_id: string
    user_id: string
    site_id: string
    clock_in: string
    clock_out: string | null
    clock_in_lat: number | null
    clock_in_lng: number | null
    clock_out_lat: number | null
    clock_out_lng: number | null
    break_minutes: number
    notes: string | null
    edited_by: string | null
    edited_at: string | null
    photo_url: string | null
    created_at: string
    updated_at: string
  },
  userName: string,
  siteMap: Map<string, string>
): TimeEntry {
  const clockIn = new Date(row.clock_in)
  const clockOut = row.clock_out ? new Date(row.clock_out) : null
  const breakMin = row.break_minutes ?? 0
  const totalMin = clockOut
    ? Math.max(0, Math.round((clockOut.getTime() - clockIn.getTime()) / 60000) - breakMin)
    : 0

  return {
    id: row.id,
    company_id: row.company_id,
    user_id: row.user_id,
    user_name: userName,
    site_id: row.site_id,
    site_name: siteMap.get(row.site_id) ?? "Unbekannte Baustelle",
    clock_in: row.clock_in,
    clock_out: row.clock_out,
    clock_in_lat: row.clock_in_lat,
    clock_in_lng: row.clock_in_lng,
    clock_out_lat: row.clock_out_lat,
    clock_out_lng: row.clock_out_lng,
    break_minutes: breakMin,
    notes: row.notes,
    edited_by: row.edited_by,
    edited_at: row.edited_at,
    photo_url: row.photo_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    total_minutes: totalMin,
    total_hours: Math.round((totalMin / 60) * 10) / 10,
    surcharge: getSurchargeType(clockIn),
  }
}

// ─── clockIn ──────────────────────────────────────────────────
// withAuth(null, "write") — Workers muessen stempeln können!

export async function clockIn(
  formData: FormData
): Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }> {
  return withAuth(null, "write", async ({ user, profile, db }) => {
    const validated = clockInSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { site_id, lat, lng, notes } = validated.data

    // Pruefe: Keine offene Schicht vorhanden
    const { data: existing } = await db
      .from("time_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_id", profile.company_id)
      .is("clock_out", null)
      .maybeSingle()

    if (existing) {
      return { error: "Sie sind bereits eingestempelt. Bitte zuerst ausstempeln." }
    }

    // Validate site belongs to company
    const { data: siteCheck } = await db
      .from("construction_sites")
      .select("id, name")
      .eq("id", site_id)
      .eq("company_id", profile.company_id)
      .maybeSingle()

    if (!siteCheck) return { error: "Baustelle gehört nicht zu Ihrer Firma" }

    const { data: entry, error } = await db
      .from("time_entries")
      .insert({
        company_id: profile.company_id,
        user_id: user.id,
        site_id,
        clock_in: new Date().toISOString(),
        clock_in_lat: lat,
        clock_in_lng: lng,
        break_minutes: 0,
        notes,
      })
      .select("id")
      .single()

    if (error) {
      trackError("time-entries", "clockIn", error.message, { table: "time_entries" })
      return { error: "Einstempeln fehlgeschlagen" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "time_entry",
      entityId: entry.id,
      title: `Eingestempelt auf ${siteCheck.name}`,
    })

    revalidatePath("/stempeln")
    revalidatePath("/disposition/zeiterfassung")
    return { success: true, id: entry.id }
  }) as Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }>
}

// ─── clockOut ─────────────────────────────────────────────────
// withAuth(null, "write") — Workers muessen stempeln können!

export async function clockOut(
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth(null, "write", async ({ user, profile, db }) => {
    const validated = clockOutSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { lat, lng, break_minutes, notes } = validated.data

    // Find open entry
    const { data: openEntry } = await db
      .from("time_entries")
      .select("id, clock_in, site_id")
      .eq("user_id", user.id)
      .eq("company_id", profile.company_id)
      .is("clock_out", null)
      .maybeSingle()

    if (!openEntry) return { error: "Kein offener Eintrag gefunden." }

    const clockOutTime = new Date()
    const clockInTime = new Date(openEntry.clock_in)
    const breakMin = break_minutes ?? 0

    // Berechne total_hours = (clock_out - clock_in - break_minutes) / 60
    const totalMinutes = Math.max(
      0,
      Math.round((clockOutTime.getTime() - clockInTime.getTime()) / 60000) - breakMin
    )

    // Berechne Zuschlaege
    const surcharge = getSurchargeType(clockInTime)

    const { error } = await db
      .from("time_entries")
      .update({
        clock_out: clockOutTime.toISOString(),
        clock_out_lat: lat,
        clock_out_lng: lng,
        break_minutes: breakMin,
        notes,
        updated_at: clockOutTime.toISOString(),
      })
      .eq("id", openEntry.id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("time-entries", "clockOut", error.message, { table: "time_entries" })
      return { error: "Ausstempeln fehlgeschlagen" }
    }

    // Plausibility check: warn if over 12 hours
    const totalHours = totalMinutes / 60
    if (totalHours > 12) {
      await logActivity({
        companyId: profile.company_id,
        userId: user.id,
        action: "warning",
        entityType: "time_entry",
        entityId: openEntry.id,
        title: `Plausibilitaetswarnung: ${Math.round(totalHours * 10) / 10}h Arbeitszeit${surcharge ? ` (${surcharge})` : ""}`,
      })
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "time_entry",
      entityId: openEntry.id,
      title: `Ausgestempelt — ${Math.round(totalHours * 10) / 10}h netto`,
    })

    revalidatePath("/stempeln")
    revalidatePath("/disposition/zeiterfassung")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

// ─── getMyOpenEntry ───────────────────────────────────────────
// withAuth(null, "read") — Workers muessen ihre offene Schicht sehen können

export async function getMyOpenEntry(): Promise<{ data?: OpenTimeEntry | null; error?: string }> {
  return withAuth(null, "read", async ({ user, profile, db }) => {
    const { data: entry, error } = await db
      .from("time_entries")
      .select("id, site_id, clock_in, notes")
      .eq("user_id", user.id)
      .eq("company_id", profile.company_id)
      .is("clock_out", null)
      .maybeSingle()

    if (error) {
      trackError("time-entries", "getMyOpenEntry", error.message, { table: "time_entries" })
      return { error: "Offene Schicht konnte nicht geladen werden" }
    }
    if (!entry) return { data: null }

    // Get site name
    const siteMap = await buildSiteNameMap(db, profile.company_id, [entry.site_id])

    return {
      data: {
        id: entry.id,
        site_id: entry.site_id,
        site_name: siteMap.get(entry.site_id) ?? "Unbekannte Baustelle",
        clock_in: entry.clock_in,
        notes: entry.notes,
      },
    }
  }) as Promise<{ data?: OpenTimeEntry | null; error?: string }>
}

// ─── getMyTimeEntries ─────────────────────────────────────────
// withAuth(null, "read") — Workers sehen ihre eigenen Einträge

export async function getMyTimeEntries(
  weekStart: string
): Promise<{ data?: TimeEntry[]; error?: string }> {
  return withAuth(null, "read", async ({ user, profile, db }) => {
    const startDate = new Date(weekStart)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    const weekEnd = endDate.toISOString().split("T")[0]

    const { data: entries, error } = await db
      .from("time_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("company_id", profile.company_id)
      .gte("clock_in", `${weekStart}T00:00:00`)
      .lte("clock_in", `${weekEnd}T23:59:59`)
      .order("clock_in", { ascending: false })

    if (error) {
      trackError("time-entries", "getMyTimeEntries", error.message, { table: "time_entries" })
      return { error: "Zeiteinträge konnten nicht geladen werden" }
    }

    const rows = entries ?? []
    if (rows.length === 0) return { data: [] }

    const siteIds = [...new Set(rows.map((e) => e.site_id))]
    const [profileMap, siteMap] = await Promise.all([
      buildProfileNameMap(db, profile.company_id, [user.id]),
      buildSiteNameMap(db, profile.company_id, siteIds),
    ])

    const userName = profileMap.get(user.id) ?? "Ich"

    return {
      data: rows.map((e) => buildTimeEntry(e, userName, siteMap)),
    }
  }) as Promise<{ data?: TimeEntry[]; error?: string }>
}

// ─── getAllTimeEntries ────────────────────────────────────────
// Admin/Dispo-Uebersicht: alle Einträge der Firma

export async function getAllTimeEntries(
  weekStart: string
): Promise<{ data?: TimeEntry[]; error?: string }> {
  return withAuth("zeiterfassung", "read", async ({ profile, db }) => {
    const startDate = new Date(weekStart)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    const weekEnd = endDate.toISOString().split("T")[0]

    const { data: entries, error } = await db
      .from("time_entries")
      .select("*")
      .eq("company_id", profile.company_id)
      .gte("clock_in", `${weekStart}T00:00:00`)
      .lte("clock_in", `${weekEnd}T23:59:59`)
      .order("clock_in", { ascending: false })

    if (error) {
      trackError("time-entries", "getAllTimeEntries", error.message, { table: "time_entries" })
      return { error: "Zeiteinträge konnten nicht geladen werden" }
    }

    const rows = entries ?? []
    if (rows.length === 0) return { data: [] }

    const userIds = [...new Set(rows.map((e) => e.user_id))]
    const siteIds = [...new Set(rows.map((e) => e.site_id))]

    const [profileMap, siteMap] = await Promise.all([
      buildProfileNameMap(db, profile.company_id, userIds),
      buildSiteNameMap(db, profile.company_id, siteIds),
    ])

    return {
      data: rows.map((e) =>
        buildTimeEntry(e, profileMap.get(e.user_id) ?? "Unbekannt", siteMap)
      ),
    }
  }) as Promise<{ data?: TimeEntry[]; error?: string }>
}

// ─── getActiveSitesForClockIn ────────────────────────────────
// withAuth(null, "read") — jeder MA darf aktive Baustellen sehen

export async function getActiveSitesForClockIn(): Promise<{
  data?: { id: string; name: string }[]
  error?: string
}> {
  return withAuth(null, "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("construction_sites")
      .select("id, name")
      .eq("company_id", profile.company_id)
      .eq("status", "active")
      .order("name", { ascending: true })

    if (error) {
      trackError("time-entries", "getActiveSitesForClockIn", error.message, {
        table: "construction_sites",
      })
      return { error: "Baustellen konnten nicht geladen werden" }
    }

    return {
      data: (data ?? []).map((s) => ({ id: s.id, name: s.name })),
    }
  }) as Promise<{ data?: { id: string; name: string }[]; error?: string }>
}

// ─── getTodayAssignment ──────────────────────────────────────
// Heutige Dispo-Zuweisung fuer den aktuellen User

export async function getTodayAssignment(): Promise<{
  data?: AssignedSiteInfo | null
  error?: string
}> {
  return withAuth(null, "read", async ({ user, profile, db }) => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

    const { data: entry, error } = await db
      .from("schedule_entries")
      .select("site_id, shift, notes")
      .eq("user_id", user.id)
      .eq("company_id", profile.company_id)
      .eq("date", todayStr)
      .maybeSingle()

    if (error || !entry) return { data: null }

    // Get site details
    const { data: site } = await db
      .from("construction_sites")
      .select("name, address, site_manager")
      .eq("id", entry.site_id)
      .eq("company_id", profile.company_id)
      .single()

    if (!site) return { data: null }

    // Get foreman info if site_manager is set
    let foremanName: string | null = null
    let foremanPhone: string | null = null
    if (site.site_manager) {
      const { data: foreman } = await db
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("id", site.site_manager)
        .single()
      if (foreman) {
        foremanName = `${foreman.first_name} ${foreman.last_name}`
        foremanPhone = foreman.phone ?? null
      }
    }

    return {
      data: {
        site_id: entry.site_id,
        site_name: site.name,
        site_address: site.address ?? null,
        shift_type: entry.shift,
        notes: entry.notes,
        foreman_name: foremanName,
        foreman_phone: foremanPhone,
      },
    }
  }) as Promise<{ data?: AssignedSiteInfo | null; error?: string }>
}

// ─── getMonthlyTimeEntries ───────────────────────────────────
// Fuer Stundenzettel: Monatsansicht

export async function getMonthlyTimeEntries(
  month: number,
  year: number,
  employeeId?: string
): Promise<{ data?: TimeEntry[]; error?: string }> {
  return withAuth("zeiterfassung", "read", async ({ profile, db }) => {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const endMonth = month === 12 ? 1 : month + 1
    const endYear = month === 12 ? year + 1 : year
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`

    let query = db
      .from("time_entries")
      .select("*")
      .eq("company_id", profile.company_id)
      .gte("clock_in", `${startDate}T00:00:00`)
      .lt("clock_in", `${endDate}T00:00:00`)
      .order("clock_in", { ascending: true })

    if (employeeId) {
      query = query.eq("user_id", employeeId)
    }

    const { data: entries, error } = await query

    if (error) {
      trackError("time-entries", "getMonthlyTimeEntries", error.message, { table: "time_entries" })
      return { error: "Monatseintraege konnten nicht geladen werden" }
    }

    const rows = entries ?? []
    if (rows.length === 0) return { data: [] }

    const userIds = [...new Set(rows.map((e) => e.user_id))]
    const siteIds = [...new Set(rows.map((e) => e.site_id))]

    const [profileMap, siteMap] = await Promise.all([
      buildProfileNameMap(db, profile.company_id, userIds),
      buildSiteNameMap(db, profile.company_id, siteIds),
    ])

    return {
      data: rows.map((e) =>
        buildTimeEntry(e, profileMap.get(e.user_id) ?? "Unbekannt", siteMap)
      ),
    }
  }) as Promise<{ data?: TimeEntry[]; error?: string }>
}

// ─── correctTimeEntry ────────────────────────────────────────
// Korrektur durch Manager (mit Audit-Trail: edited_by, edited_at)

export async function correctTimeEntry(
  entryId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("zeiterfassung", "write", async ({ user, profile, db }) => {
    const validated = correctTimeEntrySchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { clock_in, clock_out, break_minutes, site_id, notes } = validated.data

    // Verify entry belongs to company
    const { data: existing } = await db
      .from("time_entries")
      .select("id")
      .eq("id", entryId)
      .eq("company_id", profile.company_id)
      .maybeSingle()

    if (!existing) return { error: "Zeiteintrag nicht gefunden" }

    const now = new Date().toISOString()

    const { error } = await db
      .from("time_entries")
      .update({
        clock_in: new Date(clock_in).toISOString(),
        clock_out: clock_out ? new Date(clock_out).toISOString() : null,
        break_minutes,
        site_id,
        notes,
        edited_by: user.id,
        edited_at: now,
        updated_at: now,
      })
      .eq("id", entryId)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("time-entries", "correctTimeEntry", error.message, { table: "time_entries" })
      return { error: "Korrektur fehlgeschlagen" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "time_entry",
      entityId: entryId,
      title: "Zeiteintrag korrigiert (Manager-Korrektur)",
    })

    revalidatePath("/stempeln")
    revalidatePath("/disposition/zeiterfassung")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

// ─── exportTimeEntriesCSV ────────────────────────────────────
// CSV Export (Semikolon, UTF-8 BOM)

export async function exportTimeEntriesCSV(
  month: number,
  year: number
): Promise<{ data?: string; error?: string }> {
  return withAuth("zeiterfassung", "read", async ({ profile, db }) => {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const endMonth = month === 12 ? 1 : month + 1
    const endYear = month === 12 ? year + 1 : year
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`

    const { data: entries, error } = await db
      .from("time_entries")
      .select("*")
      .eq("company_id", profile.company_id)
      .gte("clock_in", `${startDate}T00:00:00`)
      .lt("clock_in", `${endDate}T00:00:00`)
      .order("clock_in", { ascending: true })

    if (error) {
      trackError("time-entries", "exportTimeEntriesCSV", error.message, { table: "time_entries" })
      return { error: "Export fehlgeschlagen" }
    }

    const rows = entries ?? []
    if (rows.length === 0) return { data: "" }

    const userIds = [...new Set(rows.map((e) => e.user_id))]
    const siteIds = [...new Set(rows.map((e) => e.site_id))]

    const [profileMap, siteMap] = await Promise.all([
      buildProfileNameMap(db, profile.company_id, userIds),
      buildSiteNameMap(db, profile.company_id, siteIds),
    ])

    const timeEntries = rows.map((e) =>
      buildTimeEntry(e, profileMap.get(e.user_id) ?? "Unbekannt", siteMap)
    )

    // UTF-8 BOM + semicolon-separated German format
    const BOM = "\uFEFF"
    const header = [
      "Mitarbeiter",
      "Baustelle",
      "Datum",
      "Beginn",
      "Ende",
      "Pause (Min)",
      "Netto-Stunden",
      "Zuschlag",
    ].join(";")

    const formatGermanDate = (iso: string) => {
      const d = new Date(iso)
      return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`
    }

    const formatGermanTime = (iso: string) => {
      const d = new Date(iso)
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    }

    const surchargeLabel = (s: SurchargeType): string => {
      if (s === "night") return "Nacht"
      if (s === "weekend") return "Wochenende"
      if (s === "holiday") return "Feiertag"
      return ""
    }

    const csvRows = timeEntries.map((e) => {
      const netHours = e.clock_out
        ? (e.total_minutes / 60).toFixed(2).replace(".", ",")
        : "0,00"

      return [
        e.user_name,
        e.site_name,
        formatGermanDate(e.clock_in),
        formatGermanTime(e.clock_in),
        e.clock_out ? formatGermanTime(e.clock_out) : "",
        String(e.break_minutes),
        netHours,
        surchargeLabel(e.surcharge),
      ].join(";")
    })

    return { data: BOM + [header, ...csvRows].join("\r\n") }
  }) as Promise<{ data?: string; error?: string }>
}
