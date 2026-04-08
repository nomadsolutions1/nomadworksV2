"use server"

import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/utils/activity-logger"
import { trackError } from "@/lib/utils/error-tracker"
import { withAuth, filterSensitiveData } from "@/lib/utils/auth-helper"
import { ROLE_LABELS } from "@/lib/utils/constants"

// ─── Schemas ────────────────────────────────────────────────

const createEmployeeSchema = z.object({
  first_name: z.string().min(1, "Vorname ist erforderlich"),
  last_name: z.string().min(1, "Nachname ist erforderlich"),
  role: z.enum(["owner", "foreman", "office", "accountant", "worker", "employee"] as const, {
    message: "Rolle ist erforderlich",
  }),
  job_title: z.string().optional().transform((v) => v || null),
  phone: z.string().optional(),
  email: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
  contract_type: z.string().optional(),
  contract_start: z.string().optional(),
  hourly_rate: z.string().optional(),
  monthly_salary: z.string().optional(),
  with_account: z.string().optional(),
  password: z.string().optional(),
})

const updateEmployeeSchema = z.object({
  first_name: z.string().min(1, "Vorname ist erforderlich"),
  last_name: z.string().min(1, "Nachname ist erforderlich"),
  role: z.enum(["owner", "foreman", "office", "accountant", "worker", "employee"]),
  job_title: z.string().optional().transform((v) => v || null),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  nationality: z.string().optional(),
  contract_type: z.string().optional(),
  contract_start: z.string().optional(),
  notice_period: z.string().optional(),
  probation_end: z.string().optional(),
  hourly_rate: z.string().optional(),
  monthly_salary: z.string().optional(),
  tax_class: z.string().optional(),
  social_security_number: z.string().optional(),
  health_insurance: z.string().optional(),
  iban: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  annual_leave_days: z.string().optional(),
})

const qualificationSchema = z.object({
  name: z.string().min(1, "Bezeichnung ist erforderlich"),
  issued_by: z.string().optional().transform((v) => v || null),
  issued_date: z.string().optional(),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
})

const leaveRequestSchema = z.object({
  start_date: z.string().min(1, "Startdatum ist erforderlich"),
  end_date: z.string().min(1, "Enddatum ist erforderlich"),
  days: z.string().min(1, "Anzahl Tage ist erforderlich"),
  type: z.string().min(1, "Typ ist erforderlich"),
  notes: z.string().optional(),
})

const sickDaySchema = z.object({
  start_date: z.string().min(1, "Startdatum ist erforderlich"),
  end_date: z.string().min(1, "Enddatum ist erforderlich"),
  days: z.string().min(1, "Anzahl Tage ist erforderlich"),
  has_certificate: z.string().optional(),
  notes: z.string().optional(),
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Mindestens 8 Zeichen"),
})

// ─── Types ──────────────────────────────────────────────────

export type Employee = {
  id: string
  company_id: string
  role: string
  first_name: string
  last_name: string
  phone: string | null
  contract_type: string | null
  contract_start: string | null
  hourly_rate: number | null
  monthly_salary: number | null
  birth_date: string | null
  nationality: string | null
  tax_class: string | null
  social_security_number: string | null
  health_insurance: string | null
  iban: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  job_title: string | null
  annual_leave_days: number | null
  notice_period: string | null
  probation_end: string | null
  has_account: boolean | null
  is_temporary: boolean | null
  created_at: string
  status?: "active" | "sick" | "vacation"
}

export type Qualification = {
  id: string
  company_id: string
  user_id: string
  name: string
  issued_by: string | null
  issued_date: string | null
  expiry_date: string | null
  notes: string | null
  created_at: string
}

export type LeaveRequest = {
  id: string
  company_id: string
  user_id: string
  start_date: string
  end_date: string
  days: number
  type: string
  status: string
  approved_by: string | null
  notes: string | null
  created_at: string
}

export type SickDay = {
  id: string
  company_id: string
  user_id: string
  start_date: string
  end_date: string
  days: number
  has_certificate: boolean | null
  notes: string | null
  created_at: string
  reported_by: string | null
  status: string | null
}

export type EmployeeStats = {
  total: number
  active: number
  absent: number
  weeklyHours: number
  totalMonthlyCost: number
  totalHourlyCost: number
  averageHourlyRate: number
  costTrend: {
    currentMonth: number
    lastMonth: number
    changePercent: number
  }
}

export type ForemanPermission = {
  module_name: string
  can_view: boolean
  can_edit: boolean
}

// ─── Employees ──────────────────────────────────────────────

export async function getEmployees(): Promise<{ data?: Employee[]; error?: string }> {
  return withAuth("mitarbeiter", "read", async ({ profile, db }) => {
    const today = new Date().toISOString().split("T")[0]

    const [profilesRes, sickRes, leaveRes] = await Promise.all([
      db
        .from("profiles")
        .select(
          "id, company_id, role, first_name, last_name, phone, contract_type, contract_start, hourly_rate, monthly_salary, has_account, is_temporary, birth_date, created_at"
        )
        .eq("company_id", profile.company_id)
        .neq("role", "super_admin")
        .order("last_name", { ascending: true }),
      db
        .from("sick_days")
        .select("user_id")
        .eq("company_id", profile.company_id)
        .lte("start_date", today)
        .gte("end_date", today),
      db
        .from("leave_requests")
        .select("user_id")
        .eq("company_id", profile.company_id)
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today),
    ])

    if (profilesRes.error) {
      trackError("employees", "getEmployees", profilesRes.error.message, { table: "profiles" })
      return { error: profilesRes.error.message }
    }

    const sickIds = new Set<string>(
      (sickRes.data ?? []).map((s) => s.user_id)
    )
    const vacationIds = new Set<string>(
      (leaveRes.data ?? []).map((l) => l.user_id)
    )

    const employees: Employee[] = (profilesRes.data ?? []).map((p) => {
      const emp: Employee = {
        ...(p as unknown as Employee),
        status: sickIds.has(p.id)
          ? "sick"
          : vacationIds.has(p.id)
            ? "vacation"
            : "active",
      }
      return filterSensitiveData(emp as unknown as Record<string, unknown>, profile) as unknown as Employee
    })

    return { data: employees }
  }) as Promise<{ data?: Employee[]; error?: string }>
}

export async function getEmployee(id: string): Promise<{ data?: Employee; error?: string }> {
  return withAuth("mitarbeiter", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error) {
      trackError("employees", "getEmployee", error.message, { table: "profiles" })
      return { error: error.message }
    }

    const employee = filterSensitiveData(data as unknown as Record<string, unknown>, profile) as unknown as Employee
    return { data: employee }
  }) as Promise<{ data?: Employee; error?: string }>
}

export async function createEmployee(
  formData: FormData
): Promise<{ success?: boolean; data?: Employee; error?: string | Record<string, string[]> }> {
  return withAuth("mitarbeiter", "write", async ({ user, profile, db }) => {
    const validated = createEmployeeSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const { with_account, email, hourly_rate, monthly_salary, contract_start, password, ...rest } =
      validated.data

    // profiles.id references auth.users.id, so we always need an auth user
    const admin = createAdminClient()
    const hasAccount = with_account === "true" && !!email
    const dummyEmail = email || `employee-${Date.now()}-${Math.random().toString(36).slice(2)}@noaccount.internal`

    if (hasAccount && (!password || password.length < 8)) {
      return { error: "Passwort muss mindestens 8 Zeichen haben" }
    }

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: dummyEmail,
      password: hasAccount ? password : crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { first_name: rest.first_name, last_name: rest.last_name },
    })

    if (authError || !authUser.user) {
      trackError("employees", "createEmployee", authError?.message ?? "Auth-User konnte nicht erstellt werden")
      return { error: authError?.message ?? "Auth-User konnte nicht erstellt werden" }
    }

    const { data, error } = await db
      .from("profiles")
      .insert({
        id: authUser.user.id,
        company_id: profile.company_id,
        first_name: rest.first_name,
        last_name: rest.last_name,
        role: rest.role,
        job_title: rest.job_title || null,
        phone: rest.phone || null,
        contract_type: rest.contract_type || null,
        hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
        monthly_salary: monthly_salary ? parseFloat(monthly_salary) : null,
        contract_start: contract_start || null,
        has_account: hasAccount,
        invited_by: user.id,
      })
      .select()
      .single()

    if (error) {
      trackError("employees", "createEmployee", error.message, { table: "profiles" })
      return { error: error.message }
    }

    // Set default permissions for foreman/office (zeiterfassung always enabled)
    if (rest.role === "foreman" || rest.role === "office") {
      await db.from("foreman_permissions").insert({
        foreman_id: authUser.user.id,
        company_id: profile.company_id,
        module_name: "zeiterfassung",
        can_view: true,
        can_edit: true,
        granted_by: user.id,
      })
    }

    // Set default permissions for accountant (view-only: rechnungen, bautagesbericht, mitarbeiter)
    if (rest.role === "accountant") {
      const accountantModules = ["rechnungen", "bautagesbericht", "mitarbeiter"]
      await db.from("foreman_permissions").insert(
        accountantModules.map((mod) => ({
          foreman_id: authUser.user.id,
          company_id: profile.company_id,
          module_name: mod,
          can_view: true,
          can_edit: false,
          granted_by: user.id,
        }))
      )
    }

    const roleLabel = ROLE_LABELS[rest.role] || "Mitarbeiter"

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "employee",
      entityId: authUser.user.id,
      title: `${rest.first_name} ${rest.last_name} als ${roleLabel} angelegt`,
    })

    revalidatePath("/mitarbeiter")
    return { success: true, data: data as unknown as Employee }
  }) as Promise<{ success?: boolean; data?: Employee; error?: string | Record<string, string[]> }>
}

export async function updateEmployee(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("mitarbeiter", "write", async ({ user, profile, db }) => {
    const validated = updateEmployeeSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const { hourly_rate, monthly_salary, annual_leave_days, ...rest } = validated.data

    const { error } = await db
      .from("profiles")
      .update({
        first_name: rest.first_name,
        last_name: rest.last_name,
        role: rest.role,
        job_title: rest.job_title || null,
        phone: rest.phone || null,
        birth_date: rest.birth_date || null,
        nationality: rest.nationality || null,
        contract_type: rest.contract_type || null,
        contract_start: rest.contract_start || null,
        notice_period: rest.notice_period || null,
        probation_end: rest.probation_end || null,
        hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
        monthly_salary: monthly_salary ? parseFloat(monthly_salary) : null,
        tax_class: rest.tax_class || null,
        social_security_number: rest.social_security_number || null,
        health_insurance: rest.health_insurance || null,
        iban: rest.iban || null,
        emergency_contact_name: rest.emergency_contact_name || null,
        emergency_contact_phone: rest.emergency_contact_phone || null,
        emergency_contact_relation: rest.emergency_contact_relation || null,
        annual_leave_days: annual_leave_days ? parseInt(annual_leave_days, 10) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("employees", "updateEmployee", error.message, { table: "profiles" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "employee",
      entityId: id,
      title: `Mitarbeiter ${rest.first_name} ${rest.last_name} aktualisiert`,
    })

    revalidatePath("/mitarbeiter")
    revalidatePath(`/mitarbeiter/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function deleteEmployee(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("mitarbeiter", "write", async ({ user, profile, db }) => {
    // Only owner can delete
    if (profile.role !== "owner") {
      return { error: "Keine Berechtigung" }
    }

    // Cannot delete yourself
    if (id === user.id) {
      return { error: "Sie können sich nicht selbst löschen" }
    }

    // Get name for activity log before deletion
    const { data: target } = await db
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    const { error } = await db
      .from("profiles")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("employees", "deleteEmployee", error.message, { table: "profiles" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "employee",
      entityId: id,
      title: target
        ? `Mitarbeiter ${target.first_name} ${target.last_name} gelöscht`
        : `Mitarbeiter gelöscht`,
    })

    revalidatePath("/mitarbeiter")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function inviteEmployee(
  id: string,
  email: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("mitarbeiter", "write", async ({ user, profile, db }) => {
    if (profile.role !== "owner") {
      return { error: "Keine Berechtigung" }
    }

    const admin = createAdminClient()

    const { error: profileError } = await db
      .from("profiles")
      .update({ has_account: true })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (profileError) {
      trackError("employees", "inviteEmployee", profileError.message)
      return { error: profileError.message }
    }

    const { error: authError } = await admin.auth.admin.updateUserById(id, {
      email,
      email_confirm: false,
    })

    if (authError) {
      trackError("employees", "inviteEmployee", authError.message)
      return { error: authError.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "invite",
      entityType: "employee",
      entityId: id,
      title: `Mitarbeiter mit ${email} eingeladen`,
    })

    revalidatePath(`/mitarbeiter/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Qualifications ──────────────────────────────────────────

export async function getQualifications(
  userId: string
): Promise<{ data?: Qualification[]; error?: string }> {
  return withAuth("mitarbeiter", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("qualifications")
      .select("*")
      .eq("user_id", userId)
      .eq("company_id", profile.company_id)
      .order("name", { ascending: true })

    if (error) {
      trackError("employees", "getQualifications", error.message, { table: "qualifications" })
      return { error: error.message }
    }
    return { data: data as Qualification[] }
  }) as Promise<{ data?: Qualification[]; error?: string }>
}

export async function addQualification(
  userId: string,
  formData: FormData
): Promise<{ success?: boolean; data?: Qualification; error?: string | Record<string, string[]> }> {
  return withAuth("mitarbeiter", "write", async ({ user, profile, db }) => {
    const validated = qualificationSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const { data, error } = await db
      .from("qualifications")
      .insert({
        user_id: userId,
        company_id: profile.company_id,
        name: validated.data.name,
        issued_by: validated.data.issued_by || null,
        issued_date: validated.data.issued_date || null,
        expiry_date: validated.data.expiry_date || null,
        notes: validated.data.notes || null,
      })
      .select()
      .single()

    if (error) {
      trackError("employees", "addQualification", error.message, { table: "qualifications" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "qualification",
      entityId: (data as { id: string }).id,
      title: `Qualifikation "${validated.data.name}" hinzugefügt`,
    })

    revalidatePath(`/mitarbeiter/${userId}`)
    return { success: true, data: data as Qualification }
  }) as Promise<{ success?: boolean; data?: Qualification; error?: string | Record<string, string[]> }>
}

export async function deleteQualification(
  qualId: string,
  userId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("mitarbeiter", "write", async ({ user, profile, db }) => {
    const { error } = await db
      .from("qualifications")
      .delete()
      .eq("id", qualId)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("employees", "deleteQualification", error.message, { table: "qualifications" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "qualification",
      entityId: qualId,
      title: `Qualifikation gelöscht`,
    })

    revalidatePath(`/mitarbeiter/${userId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Leave Requests ──────────────────────────────────────────

export async function getLeaveRequests(
  userId: string
): Promise<{ data?: LeaveRequest[]; error?: string }> {
  return withAuth("mitarbeiter", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("leave_requests")
      .select("*")
      .eq("user_id", userId)
      .eq("company_id", profile.company_id)
      .order("start_date", { ascending: false })

    if (error) {
      trackError("employees", "getLeaveRequests", error.message, { table: "leave_requests" })
      return { error: error.message }
    }
    return { data: data as LeaveRequest[] }
  }) as Promise<{ data?: LeaveRequest[]; error?: string }>
}

export async function createLeaveRequest(
  userId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("mitarbeiter", "write", async ({ user, profile, db }) => {
    const validated = leaveRequestSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const { error } = await db.from("leave_requests").insert({
      user_id: userId,
      company_id: profile.company_id,
      start_date: validated.data.start_date,
      end_date: validated.data.end_date,
      days: parseInt(validated.data.days, 10),
      type: validated.data.type,
      status: "approved",
      approved_by: user.id,
      notes: validated.data.notes || null,
    })

    if (error) {
      trackError("employees", "createLeaveRequest", error.message, { table: "leave_requests" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "leave_request",
      entityId: userId,
      title: `Urlaubsantrag für Mitarbeiter eingetragen`,
    })

    revalidatePath(`/mitarbeiter/${userId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function updateLeaveRequestStatus(
  requestId: string,
  userId: string,
  status: "approved" | "rejected"
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("mitarbeiter", "write", async ({ user, profile, db }) => {
    const { error } = await db
      .from("leave_requests")
      .update({ status, approved_by: user.id, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("employees", "updateLeaveRequestStatus", error.message, { table: "leave_requests" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "leave_request",
      entityId: requestId,
      title: `Urlaubsantrag ${status === "approved" ? "genehmigt" : "abgelehnt"}`,
    })

    revalidatePath(`/mitarbeiter/${userId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Sick Days ───────────────────────────────────────────────

export async function getSickDays(userId: string): Promise<{ data?: SickDay[]; error?: string }> {
  return withAuth("mitarbeiter", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("sick_days")
      .select("*")
      .eq("user_id", userId)
      .eq("company_id", profile.company_id)
      .order("start_date", { ascending: false })

    if (error) {
      trackError("employees", "getSickDays", error.message, { table: "sick_days" })
      return { error: error.message }
    }
    return { data: data as SickDay[] }
  }) as Promise<{ data?: SickDay[]; error?: string }>
}

export async function addSickDay(
  userId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("mitarbeiter", "write", async ({ user, profile, db }) => {
    const validated = sickDaySchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const { error } = await db.from("sick_days").insert({
      user_id: userId,
      company_id: profile.company_id,
      start_date: validated.data.start_date,
      end_date: validated.data.end_date,
      days: parseInt(validated.data.days, 10),
      has_certificate: validated.data.has_certificate === "true",
      notes: validated.data.notes || null,
      reported_by: user.id,
      status: "reported",
    })

    if (error) {
      trackError("employees", "addSickDay", error.message, { table: "sick_days" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "sick_day",
      entityId: userId,
      title: `Krankmeldung eingetragen`,
    })

    revalidatePath(`/mitarbeiter/${userId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

// ─── Stats ───────────────────────────────────────────────────

export async function getEmployeeStats(): Promise<EmployeeStats> {
  const emptyStats: EmployeeStats = {
    total: 0, active: 0, absent: 0, weeklyHours: 0,
    totalMonthlyCost: 0, totalHourlyCost: 0, averageHourlyRate: 0,
    costTrend: { currentMonth: 0, lastMonth: 0, changePercent: 0 },
  }

  const result = await withAuth("mitarbeiter", "read", async ({ profile, db }) => {
    const today = new Date().toISOString().split("T")[0]
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const [profilesRes, sickRes, leaveRes, timeRes] = await Promise.all([
      db.from("profiles").select("id", { count: "exact" })
        .eq("company_id", profile.company_id).neq("role", "super_admin"),
      db.from("sick_days").select("user_id")
        .eq("company_id", profile.company_id).lte("start_date", today).gte("end_date", today),
      db.from("leave_requests").select("user_id")
        .eq("company_id", profile.company_id).eq("status", "approved").lte("start_date", today).gte("end_date", today),
      db.from("time_entries").select("clock_in, clock_out, break_minutes")
        .eq("company_id", profile.company_id).gte("clock_in", `${weekStart}T00:00:00`),
    ])

    const total = (profilesRes.data ?? []).length
    const sickCount = (sickRes.data ?? []).length
    const vacationCount = (leaveRes.data ?? []).length
    const absent = sickCount + vacationCount
    const active = Math.max(0, total - absent)

    // Calculate weekly hours
    let totalMinutes = 0
    for (const entry of timeRes.data ?? []) {
      const clockIn = new Date(entry.clock_in)
      const clockOut = entry.clock_out ? new Date(entry.clock_out) : new Date()
      const mins = (clockOut.getTime() - clockIn.getTime()) / 60000 - (entry.break_minutes ?? 0)
      totalMinutes += Math.max(0, mins)
    }
    const weeklyHours = Math.round(totalMinutes / 60)

    // Cost calculations
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0]
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0]

    const [salaryRes, rateRes, currentTimeRes, lastTimeRes] = await Promise.all([
      db.from("profiles").select("monthly_salary")
        .eq("company_id", profile.company_id).neq("role", "super_admin").not("monthly_salary", "is", null),
      db.from("profiles").select("id, hourly_rate")
        .eq("company_id", profile.company_id).neq("role", "super_admin").not("hourly_rate", "is", null),
      db.from("time_entries").select("user_id, clock_in, clock_out, break_minutes")
        .eq("company_id", profile.company_id).gte("clock_in", `${currentMonthStart}T00:00:00`).not("clock_out", "is", null),
      db.from("time_entries").select("user_id, clock_in, clock_out, break_minutes")
        .eq("company_id", profile.company_id).gte("clock_in", `${lastMonthStart}T00:00:00`).lte("clock_in", `${lastMonthEnd}T23:59:59`).not("clock_out", "is", null),
    ])

    const totalMonthlyCost = (salaryRes.data ?? []).reduce((sum, r) => sum + (r.monthly_salary ?? 0), 0)

    const rateMap = new Map<string, number>()
    let rateSum = 0
    for (const r of rateRes.data ?? []) {
      rateMap.set(r.id, r.hourly_rate ?? 0)
      rateSum += r.hourly_rate ?? 0
    }
    const averageHourlyRate = rateRes.data && rateRes.data.length > 0
      ? Math.round((rateSum / rateRes.data.length) * 100) / 100
      : 0

    function calcHourlyCost(entries: { user_id: string; clock_in: string; clock_out: string | null; break_minutes: number | null }[]): number {
      let cost = 0
      for (const e of entries) {
        const rate = rateMap.get(e.user_id)
        if (!rate || !e.clock_out) continue
        const hours = Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - (e.break_minutes ?? 0) / 60)
        cost += hours * rate
      }
      return Math.round(cost * 100) / 100
    }

    const totalHourlyCost = calcHourlyCost(currentTimeRes.data ?? [])
    const lastMonthHourlyCost = calcHourlyCost(lastTimeRes.data ?? [])

    const currentMonthTotal = totalMonthlyCost + totalHourlyCost
    const lastMonthTotal = totalMonthlyCost + lastMonthHourlyCost
    const changePercent = lastMonthTotal > 0
      ? Math.round(((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 1000) / 10
      : 0

    return {
      total, active, absent, weeklyHours,
      totalMonthlyCost, totalHourlyCost, averageHourlyRate,
      costTrend: { currentMonth: currentMonthTotal, lastMonth: lastMonthTotal, changePercent },
    }
  })

  if (!result || "error" in result) return emptyStats
  return result as EmployeeStats
}

// ─── Foreman Permissions ────────────────────────────────────

export async function getForemanModulePermissions(
  foremanId: string
): Promise<{ data?: ForemanPermission[]; error?: string }> {
  return withAuth(null, "read", async ({ profile, db }) => {
    if (profile.role !== "owner") {
      return { error: "Keine Berechtigung" }
    }

    const { data, error } = await db
      .from("foreman_permissions")
      .select("module_name, can_view, can_edit")
      .eq("foreman_id", foremanId)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("employees", "getForemanModulePermissions", error.message)
      return { error: error.message }
    }

    return { data: (data ?? []) as ForemanPermission[] }
  }) as Promise<{ data?: ForemanPermission[]; error?: string }>
}

export async function updateForemanPermissions(
  foremanId: string,
  modules: { module_name: string; can_view: boolean; can_edit: boolean }[]
): Promise<{ success?: boolean; error?: string }> {
  return withAuth(null, "write", async ({ user, profile, db }) => {
    if (profile.role !== "owner") {
      return { error: "Keine Berechtigung" }
    }

    // Delete existing permissions and insert new ones
    await db.from("foreman_permissions").delete().eq("foreman_id", foremanId).eq("company_id", profile.company_id)

    if (modules.length > 0) {
      const rows = modules
        .filter((m) => m.can_view || m.can_edit)
        .map((m) => ({
          foreman_id: foremanId,
          company_id: profile.company_id,
          module_name: m.module_name,
          can_view: m.can_view,
          can_edit: m.can_edit,
          granted_by: user.id,
        }))

      if (rows.length > 0) {
        const { error } = await db.from("foreman_permissions").insert(rows)
        if (error) {
          trackError("employees", "updateForemanPermissions", error.message)
          return { error: error.message }
        }
      }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "permissions",
      entityId: foremanId,
      title: `Berechtigungen aktualisiert`,
    })

    revalidatePath(`/mitarbeiter/${foremanId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function updateCanViewSensitiveData(
  foremanId: string,
  canView: boolean
): Promise<{ success?: boolean; error?: string }> {
  return withAuth(null, "write", async ({ user, profile, db }) => {
    if (profile.role !== "owner") {
      return { error: "Keine Berechtigung" }
    }

    const { error } = await db
      .from("profiles")
      .update({ can_view_sensitive_data: canView })
      .eq("id", foremanId)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("employees", "updateCanViewSensitiveData", error.message)
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "employee",
      entityId: foremanId,
      title: `Sensible Daten ${canView ? "freigegeben" : "gesperrt"}`,
    })

    revalidatePath(`/mitarbeiter/${foremanId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Password Reset ────────────────────────────────────────

export async function resetEmployeePassword(
  employeeId: string,
  newPassword: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("mitarbeiter", "write", async ({ user, profile, db }) => {
    const validated = resetPasswordSchema.safeParse({ newPassword })
    if (!validated.success) return { error: "Passwort muss mindestens 8 Zeichen haben" }

    // No self-reset via this function
    if (user.id === employeeId) return { error: "Eigenes Passwort bitte über die Profil-Seite ändern" }

    // Verify employee belongs to same company
    const { data: target } = await db
      .from("profiles")
      .select("id, role, company_id")
      .eq("id", employeeId)
      .eq("company_id", profile.company_id)
      .single()

    if (!target) return { error: "Mitarbeiter nicht gefunden" }

    // Owner can reset anyone, foreman/office can only reset workers
    if (profile.role === "owner") {
      // OK
    } else if (profile.role === "foreman" || profile.role === "office") {
      if (target.role !== "worker") return { error: "Nur Passwörter von Bauarbeitern können zurückgesetzt werden" }
    } else {
      return { error: "Keine Berechtigung" }
    }

    const admin = createAdminClient()
    const { error: authError } = await admin.auth.admin.updateUserById(employeeId, {
      password: validated.data.newPassword,
    })

    if (authError) {
      trackError("employees", "resetEmployeePassword", authError.message)
      return { error: authError.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "employee",
      entityId: employeeId,
      title: `Passwort zurückgesetzt`,
    })

    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}
