import { getAllUsers } from "@/lib/actions/admin"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagement } from "@/components/modules/admin/user-management"
import { EmptyState } from "@/components/shared/empty-state"
import { Users } from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { ROLES } from "@/lib/utils/constants"
import Link from "next/link"
import type { Metadata } from "next"
import type { AdminUser } from "@/lib/actions/admin"

export const metadata: Metadata = { title: "Alle Benutzer — Admin" }

export default async function BenutzerPage() {
  const { data: users } = await getAllUsers()

  // Separate system admins (no company) from company users
  const systemAdmins = (users ?? []).filter((u) => !u.company_id)
  const companyUsers = (users ?? []).filter((u) => !!u.company_id)

  // Group company users by company
  const grouped: Record<string, { companyName: string; users: AdminUser[] }> = {}
  for (const user of companyUsers) {
    const key = user.company_id!
    if (!grouped[key]) {
      grouped[key] = { companyName: user.company_name ?? "Unbekannte Firma", users: [] }
    }
    grouped[key].users.push(user)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alle Benutzer"
        description={`${users?.length ?? 0} registrierte Benutzer in ${Object.keys(grouped).length} Firmen.`}
      />

      {/* System-Administratoren (ohne Firma) */}
      {systemAdmins.length > 0 && (
        <Card className="rounded-2xl shadow-sm overflow-hidden border-purple-500/20">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold text-purple-500">
              NomadWorks System
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({systemAdmins.length} {systemAdmins.length === 1 ? "Administrator" : "Administratoren"})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {["Name", "E-Mail", "Rolle", "Telefon", "Erstellt", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {systemAdmins.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground/80">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-purple-500/10 text-purple-500">
                          {ROLES[user.role as keyof typeof ROLES] ?? user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).length === 0 && systemAdmins.length === 0 ? (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <EmptyState
              icon={Users}
              title="Keine Benutzer"
              description="Es sind noch keine Benutzer im System registriert."
            />
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([companyId, { companyName, users: companyUsers }]) => (
          <Card key={companyId} className="rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold">
                <Link href={`/admin/firmen/${companyId}`} className="text-primary hover:underline">
                  {companyName}
                </Link>
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({companyUsers.length} Benutzer)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {["Name", "E-Mail", "Rolle", "Telefon", "Erstellt", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companyUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50 even:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground/80">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                            user.role === "super_admin"
                              ? "bg-purple-500/10 text-purple-500"
                              : user.role === "owner"
                              ? "bg-primary/10 text-primary"
                              : user.role === "foreman"
                              ? "bg-accent/10 text-accent"
                              : "bg-success/10 text-success"
                          }`}>
                            {ROLES[user.role as keyof typeof ROLES] ?? user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{user.phone ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(user.created_at)}</td>
                        <td className="px-4 py-3">
                          <UserManagement user={user} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
