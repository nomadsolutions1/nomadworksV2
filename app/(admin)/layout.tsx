import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AuthProvider } from "@/lib/context/auth-context"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ROLE_LABELS } from "@/lib/utils/constants"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .single() as { data: { first_name: string; last_name: string; role: string } | null }

  if (profile?.role !== "super_admin") redirect("/dashboard")

  const authUser = profile ? {
    id: user.id,
    email: user.email || "",
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: "super_admin",
    roleLabel: ROLE_LABELS.super_admin,
    companyId: "",
    allowedModules: [] as string[],
    isClockedIn: false,
    unreadCount: 0,
  } : null

  return (
    <AuthProvider initialUser={authUser}>
      <div className="min-h-screen bg-muted/50">
        <Sidebar role="super_admin" />
        <div className="lg:pl-64">
          <Header
            user={profile ? {
              firstName: profile.first_name,
              lastName: profile.last_name,
              email: user.email || "",
              role: ROLE_LABELS.super_admin,
            } : undefined}
            role="super_admin"
          />
          <main className="p-4 lg:p-6" aria-label="Admin-Inhalt">{children}</main>
        </div>
      </div>
    </AuthProvider>
  )
}
