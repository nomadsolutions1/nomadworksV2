import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ROLES } from "@/lib/utils/constants"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null)

  const admin = createAdminClient()

  // Load profile first to get company_id
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, role, company_id")
    .eq("id", user.id)
    .single()

  if (!profile) return NextResponse.json(null)

  const role = profile.role as string
  const companyId = profile.company_id as string

  // Load remaining data in parallel — ALL scoped to company_id
  const [permissionsRes, notifRes, openEntryRes] = await Promise.all([
    admin.from("foreman_permissions").select("module_name")
      .eq("foreman_id", user.id)
      .eq("company_id", companyId),
    admin.from("notifications").select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .is("read_at", null),
    admin.from("time_entries").select("id")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .is("clock_out", null)
      .maybeSingle(),
  ])

  return NextResponse.json({
    id: user.id,
    email: user.email || "",
    firstName: profile.first_name as string,
    lastName: profile.last_name as string,
    role,
    roleLabel: ROLES[role as keyof typeof ROLES] || role,
    companyId,
    allowedModules: (permissionsRes.data ?? []).map((p) => (p as Record<string, unknown>).module_name as string),
    isClockedIn: !!openEntryRes.data,
    unreadCount: notifRes.count ?? 0,
  })
}
