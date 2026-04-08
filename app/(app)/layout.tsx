import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Sidebar, WorkerBottomNav } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AuthProvider, type AuthUser } from "@/lib/context/auth-context"
import { ROLE_LABELS } from "@/lib/utils/constants"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const admin = createAdminClient()

  // Load profile first to get company_id
  const { data: profile } = await admin
    .from("profiles")
    .select("id, first_name, last_name, role, company_id, companies(name, onboarding_completed)")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  // Redirect super_admin to admin panel
  if (profile.role === "super_admin") redirect("/admin")

  const companyId = profile.company_id || ""

  // Load permissions, notifications, and clock status in parallel
  const [permissionsRes, notificationsRes, clockRes] = await Promise.all([
    admin
      .from("foreman_permissions")
      .select("module_name")
      .eq("foreman_id", user.id),
    admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .is("read_at", null),
    admin
      .from("time_entries")
      .select("id")
      .eq("user_id", user.id)
      .is("clock_out", null)
      .limit(1),
  ])

  const allowedModules = (permissionsRes.data ?? []).map((p) => p.module_name)
  const isClockedIn = (clockRes.data ?? []).length > 0
  const unreadCount = notificationsRes.count ?? 0

  const authUser: AuthUser = {
    id: user.id,
    email: user.email || "",
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: profile.role,
    roleLabel: ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] ?? profile.role,
    companyId,
    allowedModules,
    isClockedIn,
    unreadCount,
  }

  const isWorker = profile.role === "worker" || profile.role === "employee"

  if (isWorker) {
    return (
      <AuthProvider initialUser={authUser}>
        <div className="min-h-screen bg-muted/50 pb-20">
          <main className="p-4" aria-label="App-Inhalt">{children}</main>
          <WorkerBottomNav />
        </div>
      </AuthProvider>
    )
  }

  return (
    <AuthProvider initialUser={authUser}>
      <div className="min-h-screen bg-muted/50">
        <Sidebar role={profile.role} allowedModules={allowedModules} />
        <div className="lg:pl-64">
          <Header
            user={{
              firstName: profile.first_name,
              lastName: profile.last_name,
              email: user.email || "",
              role: ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] ?? profile.role,
            }}
            role={profile.role}
            allowedModules={allowedModules}
          />
          <main className="p-4 lg:p-6" aria-label="App-Inhalt">{children}</main>
        </div>
      </div>
    </AuthProvider>
  )
}
