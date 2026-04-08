"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { PLANS } from "@/lib/utils/constants"
import { trackError } from "@/lib/utils/error-tracker"

// ─── Types ────────────────────────────────────────────────────

export type AdminCompany = {
  id: string
  name: string
  plan: string
  is_active: boolean | null
  trial_ends_at: string | null
  max_employees: number | null
  monthly_price: number | null
  onboarding_completed: boolean | null
  created_at: string
  employee_count?: number
}

export type AdminUser = {
  id: string
  company_id: string | null
  company_name?: string | null
  first_name: string
  last_name: string
  email: string
  role: string
  phone: string | null
  created_at: string
  last_sign_in_at?: string | null
}

export type AdminStats = {
  companyCount: number
  userCount: number
  mrr: number
  arr: number
  planDistribution: Record<string, number>
  trialCount: number
  activeCount: number
}

// ─── Schemas ──────────────────────────────────────────────────

const createCompanySchema = z.object({
  // Company data
  name: z.string().min(1, "Firmenname ist erforderlich"),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  trade_license: z.string().optional(),
  // Plan
  plan: z.enum(["trial", "starter", "business", "enterprise"] as const),
  max_employees: z.string().optional(),
  monthly_price: z.string().optional(),
  // Owner
  owner_first_name: z.string().min(1, "Vorname ist erforderlich"),
  owner_last_name: z.string().min(1, "Nachname ist erforderlich"),
  owner_email: z.string().email("Ungültige E-Mail-Adresse"),
  owner_phone: z.string().optional(),
  owner_password: z.string().min(8, "Mindestens 8 Zeichen"),
  // Settings
  default_tax_rate: z.string().optional(),
  payment_terms_days: z.string().optional(),
  invoice_prefix: z.string().optional(),
})

const updateCompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Firmenname ist erforderlich"),
  plan: z.enum(["trial", "starter", "business", "enterprise"] as const),
  max_employees: z.string().optional(),
  monthly_price: z.string().optional(),
  is_active: z.string().optional(),
})

const updateUserSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(1, "Vorname ist erforderlich"),
  last_name: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Ungültige E-Mail"),
  role: z.enum(["super_admin", "owner", "foreman", "worker"] as const),
  phone: z.string().optional(),
})

const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(8, "Mindestens 8 Zeichen"),
})

// ─── Helper: verify super_admin ──────────────────────────────

async function verifySuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: "Nicht authentifiziert" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "super_admin") return { user: null, error: "Keine Berechtigung" }

  return { user, error: null }
}

// ─── Stats ────────────────────────────────────────────────────

export async function getAdminStats(): Promise<{ data: AdminStats | null; error: string | null }> {
  const { error: authErr } = await verifySuperAdmin()
  if (authErr) return { data: null, error: authErr }

  const supabase = await createClient()

  const [companiesRes, profilesRes] = await Promise.all([
    supabase.from("companies").select("id, plan, is_active, monthly_price, trial_ends_at"),
    supabase.from("profiles").select("id"),
  ])

  const companies = companiesRes.data ?? []
  const userCount = profilesRes.data?.length ?? 0

  const planDistribution: Record<string, number> = {}
  let mrr = 0
  let trialCount = 0
  let activeCount = 0

  for (const c of companies) {
    const plan = c.plan ?? "trial"
    planDistribution[plan] = (planDistribution[plan] ?? 0) + 1

    if (plan === "trial") {
      trialCount++
    } else if (c.is_active) {
      activeCount++
      mrr += c.monthly_price ?? 0
    }
  }

  return {
    data: {
      companyCount: companies.length,
      userCount,
      mrr,
      arr: mrr * 12,
      planDistribution,
      trialCount,
      activeCount,
    },
    error: null,
  }
}

// ─── Companies ───────────────────────────────────────────────

export async function getAllCompanies(): Promise<{ data: AdminCompany[] | null; error: string | null }> {
  const { error: authErr } = await verifySuperAdmin()
  if (authErr) return { data: null, error: authErr }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, plan, is_active, trial_ends_at, max_employees, monthly_price, onboarding_completed, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    trackError("admin", "getAllCompanies", error.message, { table: "companies" })
    return { data: null, error: error.message }
  }

  // Get employee counts
  const { data: profiles } = await supabase
    .from("profiles")
    .select("company_id")

  const countMap: Record<string, number> = {}
  for (const p of profiles ?? []) {
    if (p.company_id) countMap[p.company_id] = (countMap[p.company_id] ?? 0) + 1
  }

  return {
    data: (data ?? []).map((c) => ({
      ...c,
      employee_count: countMap[c.id] ?? 0,
    })),
    error: null,
  }
}

export async function getCompanyDetails(id: string) {
  const { error: authErr } = await verifySuperAdmin()
  if (authErr) return { data: null, error: authErr }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    trackError("admin", "getCompanyDetails", error.message, { table: "companies" })
    return { data: null, error: error.message }
  }
  return { data, error: null }
}

export async function createCompany(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { error: authErr } = await verifySuperAdmin()
  if (authErr) return { error: authErr }

  const validated = createCompanySchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const v = validated.data
  const adminClient = createAdminClient()

  // Create auth user for owner
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: v.owner_email,
    password: v.owner_password,
    email_confirm: true,
  })

  if (authError) {
    trackError("admin", "createCompany", authError.message, { table: "auth" })
    return { error: authError.message }
  }

  const planInfo = PLANS[v.plan as keyof typeof PLANS]
  const supabase = await createClient()

  // Create company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: v.name,
      address: v.address || null,
      tax_id: v.tax_id || null,
      trade_license: v.trade_license || null,
      plan: v.plan,
      max_employees: v.max_employees ? parseInt(v.max_employees) : planInfo.maxEmployees,
      monthly_price: v.monthly_price ? parseFloat(v.monthly_price) : planInfo.price,
      trial_ends_at: v.plan === "trial" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      is_active: true,
      onboarding_completed: false,
      default_tax_rate: v.default_tax_rate ? parseFloat(v.default_tax_rate) : 19,
      payment_terms_days: v.payment_terms_days ? parseInt(v.payment_terms_days) : 14,
      invoice_prefix: v.invoice_prefix || "RE",
      next_invoice_number: 1,
    })
    .select("id")
    .single()

  if (companyError) {
    // Cleanup auth user
    await adminClient.auth.admin.deleteUser(authData.user!.id)
    trackError("admin", "createCompany", companyError.message, { table: "companies" })
    return { error: companyError.message }
  }

  // Create owner profile
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: authData.user!.id,
      company_id: company.id,
      first_name: v.owner_first_name,
      last_name: v.owner_last_name,
      phone: v.owner_phone || null,
      role: "owner",
    })

  if (profileError) {
    trackError("admin", "createCompany", profileError.message, { table: "profiles" })
    return { error: profileError.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function updateCompany(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { error: authErr } = await verifySuperAdmin()
  if (authErr) return { error: authErr }

  const validated = updateCompanySchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const v = validated.data
  const supabase = await createClient()

  // If monthly_price not explicitly set, use plan default
  const planInfo = PLANS[v.plan as keyof typeof PLANS]
  const monthlyPrice = v.monthly_price ? parseFloat(v.monthly_price) : planInfo?.price ?? undefined

  const { error } = await supabase
    .from("companies")
    .update({
      name: v.name,
      plan: v.plan,
      max_employees: v.max_employees ? parseInt(v.max_employees) : planInfo?.maxEmployees ?? undefined,
      monthly_price: monthlyPrice,
      is_active: v.is_active === "true",
    })
    .eq("id", v.id)

  if (error) {
    trackError("admin", "updateCompany", error.message, { table: "companies" })
    return { error: error.message }
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/firmen/${v.id}`)
  return { success: true }
}

export async function deactivateCompany(id: string): Promise<{ success?: boolean; error?: string }> {
  const { error: authErr } = await verifySuperAdmin()
  if (authErr) return { error: authErr }

  const supabase = await createClient()
  const { error } = await supabase
    .from("companies")
    .update({ is_active: false })
    .eq("id", id)

  if (error) {
    trackError("admin", "deactivateCompany", error.message, { table: "companies" })
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

// ─── Users ───────────────────────────────────────────────────

export async function getAllUsers(): Promise<{ data: AdminUser[] | null; error: string | null }> {
  const { error: authErr } = await verifySuperAdmin()
  if (authErr) return { data: null, error: authErr }

  const supabase = await createClient()
  const admin = createAdminClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, company_id, first_name, last_name, role, phone, created_at, companies(name)")
    .order("created_at", { ascending: false })

  if (error) {
    trackError("admin", "getAllUsers", error.message, { table: "profiles" })
    return { data: null, error: error.message }
  }

  // Fetch emails from auth.users via admin client
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map<string, string>()
  for (const u of authUsers?.users ?? []) {
    emailMap.set(u.id, u.email ?? "")
  }

  return {
    data: (data ?? []).map((p) => ({
      id: p.id,
      company_id: p.company_id,
      company_name: p.companies?.name ?? null,
      first_name: p.first_name,
      last_name: p.last_name,
      email: emailMap.get(p.id) ?? "",
      role: p.role,
      phone: p.phone,
      created_at: p.created_at,
    })),
    error: null,
  }
}

export async function updateUser(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { error: authErr } = await verifySuperAdmin()
  if (authErr) return { error: authErr }

  const validated = updateUserSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const v = validated.data
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: v.first_name,
      last_name: v.last_name,
      role: v.role,
      phone: v.phone || null,
    })
    .eq("id", v.id)

  if (profileError) {
    trackError("admin", "updateUser", profileError.message, { table: "profiles" })
    return { error: profileError.message }
  }

  // Update auth email
  const { error: authError } = await adminClient.auth.admin.updateUserById(v.id, {
    email: v.email,
  })

  if (authError) {
    trackError("admin", "updateUser", authError.message, { table: "auth" })
    return { error: authError.message }
  }

  revalidatePath("/admin/benutzer")
  return { success: true }
}

export async function resetUserPassword(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { error: authErr } = await verifySuperAdmin()
  if (authErr) return { error: authErr }

  const validated = resetPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const v = validated.data
  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.updateUserById(v.userId, {
    password: v.newPassword,
  })

  if (error) {
    trackError("admin", "resetUserPassword", error.message, { table: "auth" })
    return { error: error.message }
  }
  return { success: true }
}

export async function deleteUser(userId: string): Promise<{ success?: boolean; error?: string }> {
  const { error: authErr } = await verifySuperAdmin()
  if (authErr) return { error: authErr }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Delete profile
  await supabase.from("profiles").delete().eq("id", userId)

  // Delete auth user
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) {
    trackError("admin", "deleteUser", error.message, { table: "auth" })
    return { error: error.message }
  }

  revalidatePath("/admin/benutzer")
  return { success: true }
}
