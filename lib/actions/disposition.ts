"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"
import { logActivity } from "@/lib/utils/activity-logger"
import { withAuth } from "@/lib/utils/auth-helper"
import { buildProfileNameMap, buildSiteNameMap } from "@/lib/utils/shared-queries"

// ─── Types ────────────────────────────────────────────────────

export type Assignment = {
  id: string
  company_id: string
  user_id: string
  site_id: string
  date: string
  shift_type: string
  start_time: string | null
  end_time: string | null
  break_minutes: number
  notes: string | null
  created_at: string
  // Joined
  user_name: string
  site_name: string
}

export type EmployeeCapacity = {
  user_id: string
  user_name: string
  assigned_days: number
  total_workdays: number
  assignments: Assignment[]
}

// ─── Zod Schemas ──────────────────────────────────────────────

const assignmentSchema = z.object({
  employee_id: z.string().uuid("Mitarbeiter ist erforderlich"),
  site_id: z.string().uuid("Baustelle ist erforderlich"),
  date: z.string().min(1, "Datum ist erforderlich"),
  start_time: z.string().optional().transform((v) => v || null),
  end_time: z.string().optional().transform((v) => v || null),
  break_minutes: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 0)),
  shift_type: z
    .enum(["frueh", "spaet", "nacht", "ganztag", "custom"])
    .default("ganztag"),
  notes: z.string().optional().transform((v) => v || null),
})

const bulkAssignmentSchema = z.object({
  employee_id: z.string().uuid("Mitarbeiter ist erforderlich"),
  site_id: z.string().uuid("Baustelle ist erforderlich"),
  days: z.array(z.string().min(1, "Datum ist erforderlich")).min(1, "Mindestens ein Tag erforderlich"),
  start_time: z.string().optional().transform((v) => v || null),
  end_time: z.string().optional().transform((v) => v || null),
  break_minutes: z.coerce.number().min(0).default(0),
  shift_type: z
    .enum(["frueh", "spaet", "nacht", "ganztag", "custom"])
    .default("ganztag"),
  notes: z.string().optional().transform((v) => v || null),
})

// ─── Helpers ──────────────────────────────────────────────────

function mapShiftTypeToDb(shiftType: string): string | null {
  if (shiftType === "ganztag") return null
  return shiftType
}

function mapDbToShiftType(shift: string | null): string {
  return shift || "ganztag"
}

function rowToAssignment(
  row: {
    id: string
    company_id: string
    user_id: string
    site_id: string
    date: string
    shift: string | null
    start_time: string | null
    end_time: string | null
    break_minutes: number | null
    notes: string | null
    created_at: string
  },
  profileMap: Map<string, string>,
  siteMap: Map<string, string>
): Assignment {
  return {
    id: row.id,
    company_id: row.company_id,
    user_id: row.user_id,
    site_id: row.site_id,
    date: row.date,
    shift_type: mapDbToShiftType(row.shift),
    start_time: row.start_time ?? null,
    end_time: row.end_time ?? null,
    break_minutes: row.break_minutes ?? 0,
    notes: row.notes ?? null,
    created_at: row.created_at,
    user_name: profileMap.get(row.user_id) ?? "Unbekannt",
    site_name: siteMap.get(row.site_id) ?? "Unbekannte Baustelle",
  }
}

// ─── getWeekAssignments ───────────────────────────────────────

export async function getWeekAssignments(
  weekStart: string
): Promise<{ data?: Assignment[]; error?: string }> {
  return withAuth("disposition", "read", async ({ profile, db }) => {
    const startDate = new Date(weekStart)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    const weekEnd = endDate.toISOString().split("T")[0]

    const { data: entries, error } = await db
      .from("schedule_entries")
      .select("*")
      .eq("company_id", profile.company_id)
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .order("date", { ascending: true })

    if (error) {
      trackError("disposition", "getWeekAssignments", error.message, { table: "schedule_entries" })
      return { error: "Zuweisungen konnten nicht geladen werden" }
    }

    const rows = entries ?? []
    if (rows.length === 0) return { data: [] }

    const userIds = [...new Set(rows.map((r) => r.user_id))]
    const siteIds = [...new Set(rows.map((r) => r.site_id))]

    const [profileMap, siteMap] = await Promise.all([
      buildProfileNameMap(db, profile.company_id, userIds),
      buildSiteNameMap(db, profile.company_id, siteIds),
    ])

    return {
      data: rows.map((row) => rowToAssignment(row, profileMap, siteMap)),
    }
  }) as Promise<{ data?: Assignment[]; error?: string }>
}

// ─── getCapacities ────────────────────────────────────────────

export async function getCapacities(
  weekStart: string
): Promise<{ data?: EmployeeCapacity[]; error?: string }> {
  return withAuth("disposition", "read", async ({ profile, db }) => {
    const startDate = new Date(weekStart)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    const weekEnd = endDate.toISOString().split("T")[0]

    const [profilesRes, assignRes] = await Promise.all([
      db
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("company_id", profile.company_id)
        .neq("role", "super_admin")
        .order("last_name", { ascending: true }),
      db
        .from("schedule_entries")
        .select("*")
        .eq("company_id", profile.company_id)
        .gte("date", weekStart)
        .lte("date", weekEnd),
    ])

    if (profilesRes.error) {
      trackError("disposition", "getCapacities", profilesRes.error.message, { table: "profiles" })
      return { error: "Kapazitaeten konnten nicht geladen werden" }
    }

    const employees = profilesRes.data ?? []
    const assignments = assignRes.data ?? []

    // Build name maps
    const siteIds = [...new Set(assignments.map((a) => a.site_id))]
    const [profileMap, siteMap] = await Promise.all([
      buildProfileNameMap(db, profile.company_id),
      buildSiteNameMap(db, profile.company_id, siteIds),
    ])

    return {
      data: employees.map((emp) => {
        const empName = `${emp.first_name} ${emp.last_name}`
        const empAssignments = assignments
          .filter((a) => a.user_id === emp.id)
          .map((a) => rowToAssignment(a, profileMap, siteMap))

        const uniqueDays = new Set(empAssignments.map((a) => a.date)).size

        return {
          user_id: emp.id,
          user_name: empName,
          assigned_days: uniqueDays,
          total_workdays: 7,
          assignments: empAssignments,
        }
      }),
    }
  }) as Promise<{ data?: EmployeeCapacity[]; error?: string }>
}

// ─── createAssignment ─────────────────────────────────────────

export async function createAssignment(
  formData: FormData
): Promise<{
  success?: boolean
  data?: Assignment
  warning?: string
  error?: string | Record<string, string[]>
}> {
  return withAuth("disposition", "write", async ({ user, profile, db }) => {
    const validated = assignmentSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { employee_id, site_id, date, start_time, end_time, break_minutes, shift_type, notes } =
      validated.data

    // Validate references belong to this company
    const [empRes, siteRes] = await Promise.all([
      db
        .from("profiles")
        .select("id")
        .eq("id", employee_id)
        .eq("company_id", profile.company_id)
        .neq("role", "super_admin")
        .maybeSingle(),
      db
        .from("construction_sites")
        .select("id")
        .eq("id", site_id)
        .eq("company_id", profile.company_id)
        .maybeSingle(),
    ])

    if (!empRes.data) return { error: "Mitarbeiter gehoert nicht zu Ihrer Firma" }
    if (!siteRes.data) return { error: "Baustelle gehoert nicht zu Ihrer Firma" }

    // Conflict detection: employee already assigned on this day?
    let warning: string | undefined
    const { data: existing } = await db
      .from("schedule_entries")
      .select("id, site_id")
      .eq("user_id", employee_id)
      .eq("date", date)
      .eq("company_id", profile.company_id)

    if (existing && existing.length > 0) {
      warning = `Mitarbeiter ist an diesem Tag bereits ${existing.length}x zugewiesen`
    }

    const { data: entry, error } = await db
      .from("schedule_entries")
      .insert({
        company_id: profile.company_id,
        user_id: employee_id,
        site_id,
        date,
        shift: mapShiftTypeToDb(shift_type),
        start_time,
        end_time,
        break_minutes,
        notes,
      })
      .select()
      .single()

    if (error) {
      trackError("disposition", "createAssignment", error.message, { table: "schedule_entries" })
      return { error: "Zuweisung konnte nicht erstellt werden" }
    }

    const [profileMap, siteMap] = await Promise.all([
      buildProfileNameMap(db, profile.company_id, [employee_id]),
      buildSiteNameMap(db, profile.company_id, [site_id]),
    ])

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "assignment",
      entityId: entry.id,
      title: `Zuweisung erstellt: ${profileMap.get(employee_id) ?? "MA"} -> ${siteMap.get(site_id) ?? "Baustelle"} am ${date}`,
    })

    revalidatePath("/disposition")
    return {
      success: true,
      data: rowToAssignment(entry, profileMap, siteMap),
      warning,
    }
  }) as Promise<{
    success?: boolean
    data?: Assignment
    warning?: string
    error?: string | Record<string, string[]>
  }>
}

// ─── updateAssignment ─────────────────────────────────────────

export async function updateAssignment(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("disposition", "write", async ({ user, profile, db }) => {
    const validated = assignmentSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { employee_id, site_id, date, start_time, end_time, break_minutes, shift_type, notes } =
      validated.data

    // Validate references belong to this company
    const [empRes, siteRes] = await Promise.all([
      db
        .from("profiles")
        .select("id")
        .eq("id", employee_id)
        .eq("company_id", profile.company_id)
        .neq("role", "super_admin")
        .maybeSingle(),
      db
        .from("construction_sites")
        .select("id")
        .eq("id", site_id)
        .eq("company_id", profile.company_id)
        .maybeSingle(),
    ])

    if (!empRes.data) return { error: "Mitarbeiter gehoert nicht zu Ihrer Firma" }
    if (!siteRes.data) return { error: "Baustelle gehoert nicht zu Ihrer Firma" }

    const { error } = await db
      .from("schedule_entries")
      .update({
        user_id: employee_id,
        site_id,
        date,
        shift: mapShiftTypeToDb(shift_type),
        start_time,
        end_time,
        break_minutes,
        notes,
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("disposition", "updateAssignment", error.message, { table: "schedule_entries" })
      return { error: "Zuweisung konnte nicht aktualisiert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "assignment",
      entityId: id,
      title: `Zuweisung aktualisiert am ${date}`,
    })

    revalidatePath("/disposition")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

// ─── deleteAssignment ─────────────────────────────────────────

export async function deleteAssignment(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("disposition", "write", async ({ user, profile, db }) => {
    // Only owner, super_admin, or the creator of the assignment may delete.
    // Note: schedule_entries has no created_by column, so we check the
    // activity log for the original "create" action as a fallback.
    if (profile.role !== "owner" && profile.role !== "super_admin") {
      // Check if the current user originally created this assignment
      const { data: createLog } = await db
        .from("activity_log")
        .select("user_id")
        .eq("entity_type", "assignment")
        .eq("entity_id", id)
        .eq("action", "create")
        .maybeSingle()

      if (!createLog || createLog.user_id !== user.id) {
        return { error: "Nur der Inhaber oder der Ersteller darf Zuweisungen loeschen" }
      }
    }

    const { error } = await db
      .from("schedule_entries")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("disposition", "deleteAssignment", error.message, { table: "schedule_entries" })
      return { error: "Zuweisung konnte nicht geloescht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "assignment",
      entityId: id,
      title: "Zuweisung geloescht",
    })

    revalidatePath("/disposition")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── bulkCreateAssignments ────────────────────────────────────
// Ein MA, eine Baustelle, mehrere Tage auf einmal (Wochenplanung)

export async function bulkCreateAssignments(
  data: {
    employee_id: string
    site_id: string
    days: string[]
    start_time?: string
    end_time?: string
    break_minutes?: number
    shift_type?: string
    notes?: string
  }
): Promise<{
  success?: boolean
  created?: number
  warnings?: string[]
  error?: string | Record<string, string[]>
}> {
  return withAuth("disposition", "write", async ({ user, profile, db }) => {
    const validated = bulkAssignmentSchema.safeParse(data)
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { employee_id, site_id, days, start_time, end_time, break_minutes, shift_type, notes } =
      validated.data

    // Validate references belong to this company
    const [empRes, siteRes] = await Promise.all([
      db
        .from("profiles")
        .select("id")
        .eq("id", employee_id)
        .eq("company_id", profile.company_id)
        .neq("role", "super_admin")
        .maybeSingle(),
      db
        .from("construction_sites")
        .select("id")
        .eq("id", site_id)
        .eq("company_id", profile.company_id)
        .maybeSingle(),
    ])

    if (!empRes.data) return { error: "Mitarbeiter gehoert nicht zu Ihrer Firma" }
    if (!siteRes.data) return { error: "Baustelle gehoert nicht zu Ihrer Firma" }

    // Conflict detection: check which days already have assignments
    const warnings: string[] = []
    const { data: existingEntries } = await db
      .from("schedule_entries")
      .select("date")
      .eq("user_id", employee_id)
      .eq("company_id", profile.company_id)
      .in("date", days)

    if (existingEntries && existingEntries.length > 0) {
      const conflictDates = existingEntries.map((e) => e.date)
      warnings.push(`Mitarbeiter bereits zugewiesen an: ${conflictDates.join(", ")}`)
    }

    // Create entries for all days
    const entries = days.map((day) => ({
      company_id: profile.company_id,
      user_id: employee_id,
      site_id,
      date: day,
      shift: mapShiftTypeToDb(shift_type),
      start_time,
      end_time,
      break_minutes,
      notes,
    }))

    const { error } = await db.from("schedule_entries").insert(entries)

    if (error) {
      trackError("disposition", "bulkCreateAssignments", error.message, { table: "schedule_entries" })
      return { error: "Zuweisungen konnten nicht erstellt werden" }
    }

    const [profileMap, siteMap] = await Promise.all([
      buildProfileNameMap(db, profile.company_id, [employee_id]),
      buildSiteNameMap(db, profile.company_id, [site_id]),
    ])

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "assignment",
      title: `${days.length} Zuweisungen erstellt: ${profileMap.get(employee_id) ?? "MA"} -> ${siteMap.get(site_id) ?? "Baustelle"}`,
    })

    revalidatePath("/disposition")
    return {
      success: true,
      created: entries.length,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }) as Promise<{
    success?: boolean
    created?: number
    warnings?: string[]
    error?: string | Record<string, string[]>
  }>
}
