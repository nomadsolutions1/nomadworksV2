import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database"

export type UserProfile = {
  id: string
  company_id: string | null
  role: "super_admin" | "owner" | "foreman" | "office" | "accountant" | "worker" | "employee"
  can_view_sensitive_data?: boolean
}

/** Profile with guaranteed company_id (for non-super_admin users) */
export type CompanyUserProfile = UserProfile & { company_id: string }

/**
 * Type guard: ensures profile has a company_id.
 * Super admins have no company — use this before company-scoped queries.
 */
export function hasCompany(profile: UserProfile): profile is CompanyUserProfile {
  return profile.company_id !== null
}

export type AuthContext = {
  user: { id: string; email?: string } | null
  profile: UserProfile | null
  db: SupabaseClient<Database>
}

/**
 * Get current authenticated user + profile + admin DB client.
 * Auth is verified via the user-scoped client, then the admin client
 * is used for DB operations to bypass RLS (role checks happen in actions).
 */
export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, db: null as never }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("id, company_id, role, can_view_sensitive_data")
    .eq("id", user.id)
    .single()

  return { user, profile: profile as UserProfile | null, db: admin }
}

/**
 * Like getAuthContext, but ensures the user belongs to a company.
 * Super admins (no company) get an auth error — they use the admin panel.
 * All company-scoped actions should use this instead of getAuthContext.
 */
export async function requireCompanyAuth(): Promise<
  | {
      user: { id: string; email?: string }
      profile: CompanyUserProfile
      db: SupabaseClient<Database>
    }
  | { user: null; profile: null; db: never }
> {
  const ctx = await getAuthContext()
  if (!ctx.user || !ctx.profile) return { user: null, profile: null, db: null as never }
  if (!hasCompany(ctx.profile)) return { user: null, profile: null, db: null as never }
  return { user: ctx.user, profile: ctx.profile, db: ctx.db }
}

/**
 * Check if a user has permission for a specific module.
 * Returns true if the user has the permission, false otherwise.
 * Owner always has all permissions.
 * Super admin never has module permissions (uses admin panel).
 * Worker/Employee never has module permissions.
 *
 * FIX: Uses the passed db client instead of creating a new admin client.
 */
export async function checkModuleAccess(
  profile: UserProfile,
  moduleName: string,
  mode: "read" | "write" = "read",
  db: SupabaseClient<Database>
): Promise<boolean> {
  // Worker/Employee: never
  if (profile.role === "worker" || profile.role === "employee") return false
  // Owner: always
  if (profile.role === "owner") return true
  // Super admin: never (they use the admin panel, not company modules)
  if (profile.role === "super_admin") return false

  // Foreman + Office + Accountant: check foreman_permissions table
  const { data } = await db
    .from("foreman_permissions")
    .select("can_view, can_edit")
    .eq("foreman_id", profile.id)
    .eq("module_name", moduleName)
    .single()

  if (!data) return false
  return mode === "write" ? !!data.can_edit : !!data.can_view
}

/**
 * Get all module permissions for a user.
 * Returns a map of module_name -> { can_view, can_edit }
 *
 * FIX: Uses the passed db client instead of creating a new admin client.
 */
export async function getForemanPermissions(
  foremanId: string,
  db: SupabaseClient<Database>
): Promise<Record<string, { can_view: boolean; can_edit: boolean }>> {
  const { data } = await db
    .from("foreman_permissions")
    .select("module_name, can_view, can_edit")
    .eq("foreman_id", foremanId)

  const permissions: Record<string, { can_view: boolean; can_edit: boolean }> = {}
  if (data) {
    for (const row of data) {
      permissions[row.module_name] = {
        can_view: !!row.can_view,
        can_edit: !!row.can_edit,
      }
    }
  }
  return permissions
}

/**
 * Check if a role can access a given module.
 * Used by both proxy.ts and server actions.
 */
export function canRoleAccessModule(
  role: string,
  moduleName: string,
  foremanPermissions?: Record<string, { can_view: boolean; can_edit: boolean }>
): boolean {
  if (role === "owner") return true
  if (role === "super_admin") return false // admin uses admin panel
  if (role === "worker" || role === "employee") return false

  // Foreman + Office + Accountant: check permissions map
  if ((role === "foreman" || role === "office" || role === "accountant") && foremanPermissions) {
    return !!foremanPermissions[moduleName]?.can_view
  }

  return false
}

/**
 * Wrapper that combines requireCompanyAuth + checkModuleAccess + null-check.
 * Every company-scoped server action should use this.
 *
 * @param module - Module name to check permissions for (null = no module check, just auth)
 * @param mode - "read" or "write" permission level
 * @param fn - The actual action logic, receives authenticated context
 */
export async function withAuth<T>(
  module: string | null,
  mode: "read" | "write",
  fn: (ctx: {
    user: { id: string; email?: string }
    profile: CompanyUserProfile
    db: SupabaseClient<Database>
  }) => Promise<T>
): Promise<T | { error: string }> {
  const ctx = await requireCompanyAuth()
  if (!ctx.user || !ctx.profile) {
    return { error: "Nicht authentifiziert" }
  }

  if (module) {
    const access = await checkModuleAccess(ctx.profile, module, mode, ctx.db)
    if (!access) {
      return { error: "Keine Berechtigung" }
    }
  }

  return fn(ctx as {
    user: { id: string; email?: string }
    profile: CompanyUserProfile
    db: SupabaseClient<Database>
  })
}

// Sensitive fields that should be hidden from foreman without can_view_sensitive_data
export const SENSITIVE_EMPLOYEE_FIELDS = [
  "hourly_rate",
  "monthly_salary",
  "iban",
  "bic",
  "tax_class",
  "social_security_number",
  "health_insurance",
  "bank_name",
] as const

/**
 * Strip sensitive fields from an employee object if the viewer is a foreman
 * without can_view_sensitive_data permission.
 */
export function filterSensitiveData<T extends Record<string, unknown>>(
  data: T,
  profile: UserProfile
): T {
  if (profile.role === "owner" || profile.role === "super_admin") return data
  if ((profile.role === "foreman" || profile.role === "accountant") && profile.can_view_sensitive_data) return data

  const filtered = { ...data }
  for (const field of SENSITIVE_EMPLOYEE_FIELDS) {
    if (field in filtered) {
      delete filtered[field]
    }
  }
  return filtered
}
