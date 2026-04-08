import { getAdminStats, getAllCompanies } from "@/lib/actions/admin"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, TrendingUp, CreditCard, Plus, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin Panel" }

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
}

const PLAN_COLORS: Record<string, string> = {
  trial: "#64748b",
  starter: "#3b82f6",
  business: "#1e3a5f",
  enterprise: "#8b5cf6",
}

export default async function AdminPage() {
  const [statsRes, companiesRes] = await Promise.all([
    getAdminStats(),
    getAllCompanies(),
  ])

  const stats = statsRes.data
  const companies = companiesRes.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        description="Verwaltung aller Firmen und Benutzer."
      >
        <Link href="/admin/firmen/neu">
          <Button className="rounded-xl bg-primary hover:bg-primary/80 font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Firma anlegen
          </Button>
        </Link>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Firmen"
          value={stats?.companyCount ?? 0}
          context={`${stats?.trialCount ?? 0} Trial, ${stats?.activeCount ?? 0} aktiv`}
          icon={Building2}
        />
        <StatCard
          title="Benutzer"
          value={stats?.userCount ?? 0}
          context="Registrierte Benutzer gesamt"
          icon={Users}
        />
        <StatCard
          title="MRR"
          value={stats ? formatCurrency(stats.mrr) : "—"}
          context="Monthly Recurring Revenue"
          icon={TrendingUp}
        />
        <StatCard
          title="ARR"
          value={stats ? formatCurrency(stats.arr) : "—"}
          context="Annual Recurring Revenue"
          icon={CreditCard}
        />
      </div>

      {/* Plan distribution */}
      {stats && Object.keys(stats.planDistribution).length > 0 && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Plan-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.planDistribution).map(([plan, count]) => (
                <div
                  key={plan}
                  className="flex items-center gap-2 rounded-xl border px-4 py-2"
                  style={{ borderColor: `${PLAN_COLORS[plan] ?? "#64748b"}30`, backgroundColor: `${PLAN_COLORS[plan] ?? "#64748b"}08` }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[plan] ?? "#64748b" }} />
                  <span className="text-sm font-medium text-foreground">{PLAN_LABELS[plan] ?? plan}</span>
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-lg"
                    style={{ backgroundColor: `${PLAN_COLORS[plan] ?? "#64748b"}20`, color: PLAN_COLORS[plan] ?? "#64748b" }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Companies table */}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Firmen</CardTitle>
          <Link href="/admin/benutzer">
            <Button variant="outline" size="sm" className="rounded-xl">
              <Users className="h-4 w-4 mr-2" />
              Alle Benutzer
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["Firma", "Plan", "Mitarbeiter", "Status", "Erstellt", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b hover:bg-muted/50 even:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/firmen/${company.id}`}
                        className="font-medium text-primary hover:underline text-sm"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-lg"
                        style={{
                          backgroundColor: `${PLAN_COLORS[company.plan] ?? "#64748b"}15`,
                          color: PLAN_COLORS[company.plan] ?? "#64748b",
                        }}
                      >
                        {PLAN_LABELS[company.plan] ?? company.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/80">
                      {company.employee_count ?? 0}/{company.max_employees}
                    </td>
                    <td className="px-4 py-3">
                      {company.plan === "trial" && company.trial_ends_at ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-accent/10 text-accent">
                          Trial bis {formatDate(company.trial_ends_at)}
                        </span>
                      ) : company.is_active ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-success/10 text-success">
                          Aktiv
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-danger/10 text-danger">
                          Inaktiv
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(company.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/firmen/${company.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Noch keine Firmen angelegt.
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
