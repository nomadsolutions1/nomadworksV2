import { getCompanyDetails, getAllUsers } from "@/lib/actions/admin"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagement } from "@/components/modules/admin/user-management"
import { Building2, Users, Calendar, CreditCard } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils/format"
import { ROLES } from "@/lib/utils/constants"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { AdminUser } from "@/lib/actions/admin"

type AnyRow = Record<string, unknown>

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getCompanyDetails(id)
  return { title: data ? `${(data as AnyRow).name as string} — Admin` : "Firma" }
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
}

export default async function FirmaDetailPage({ params }: Props) {
  const { id } = await params
  const [companyRes, usersRes] = await Promise.all([
    getCompanyDetails(id),
    getAllUsers(),
  ])

  if (!companyRes.data) notFound()

  const company = companyRes.data as AnyRow
  const companyUsers = (usersRes.data ?? []).filter((u: AdminUser) => u.company_id === id)

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name as string}
        description={`Firma-Details und Benutzerverwaltung`}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Plan"
          value={PLAN_LABELS[company.plan as string] ?? (company.plan as string)}
          context={company.monthly_price ? formatCurrency(company.monthly_price as number) + "/Monat" : "Kostenlos"}
          icon={CreditCard}
        />
        <StatCard
          title="Mitarbeiter"
          value={`${companyUsers.length}/${company.max_employees as number}`}
          context="Aktuelle Nutzung"
          icon={Users}
        />
        <StatCard
          title="Status"
          value={(company.is_active as boolean) ? "Aktiv" : "Inaktiv"}
          context={(company.plan as string) === "trial" && company.trial_ends_at
            ? `Trial bis ${formatDate(company.trial_ends_at as string)}`
            : "Produktiv"}
          icon={Building2}
        />
        <StatCard
          title="Erstellt"
          value={formatDate(company.created_at as string)}
          context="Registrierungsdatum"
          icon={Calendar}
        />
      </div>

      {/* Company details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Firmendaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Name", value: company.name as string },
              { label: "Adresse", value: (company.address as string) ?? "—" },
              { label: "Steuernummer", value: (company.tax_id as string) ?? "—" },
              { label: "Gewerbeschein", value: (company.trade_license as string) ?? "—" },
              { label: "Onboarding", value: (company.onboarding_completed as boolean) ? "Abgeschlossen" : "Ausstehend" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Rechnungseinstellungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Präfix", value: (company.invoice_prefix as string) ?? "RE" },
              { label: "Nächste Nr.", value: String(company.next_invoice_number ?? 1) },
              { label: "Steuersatz", value: company.default_tax_rate ? `${company.default_tax_rate as number} %` : "19 %" },
              { label: "Zahlungsziel", value: company.payment_terms_days ? `${company.payment_terms_days as number} Tage` : "14 Tage" },
              { label: "Bank", value: (company.bank_name as string) ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Users */}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Benutzer ({companyUsers.length})</CardTitle>
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
                {companyUsers.map((user: AdminUser) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50 even:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/80">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-foreground/80">
                      {ROLES[user.role as keyof typeof ROLES] ?? user.role}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      <UserManagement user={user} />
                    </td>
                  </tr>
                ))}
                {companyUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Keine Benutzer in dieser Firma.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
