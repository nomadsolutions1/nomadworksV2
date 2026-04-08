import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ROLES } from "@/lib/utils/constants"
import { NextResponse } from "next/server"

type AnyRow = Record<string, unknown>

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null)

  const admin = createAdminClient()

  // Load all data in parallel
  const [profileRes, permissionsRes, notifRes, openEntryRes] = await Promise.all([
    admin.from("profiles").select("first_name, last_name, role, company_id")
      .eq("id", user.id).single(),
    admin.from("foreman_permissions").select("module_name")
      .eq("foreman_id", user.id),
    admin.from("notifications").select("id", { count: "exact", head: true })
      .is("read_at", null),
    admin.from("time_entries").select("id")
      .eq("user_id", user.id).is("clock_out", null).maybeSingle(),
  ])

  const profile = profileRes.data as AnyRow | null
  if (!profile) return NextResponse.json(null)

  const role = profile.role as string

  return NextResponse.json({
    id: user.id,
    email: user.email || "",
    firstName: profile.first_name as string,
    lastName: profile.last_name as string,
    role,
    roleLabel: ROLES[role as keyof typeof ROLES] || role,
    companyId: profile.company_id as string,
    allowedModules: (permissionsRes.data ?? []).map((p: AnyRow) => p.module_name as string),
    isClockedIn: !!openEntryRes.data,
    unreadCount: notifRes.count ?? 0,
  })
}
