"use client"

import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { DataTable } from "@/components/shared/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, UserX, Clock, DollarSign, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import Link from "next/link"
import type { Column } from "@/components/shared/data-table"
import type { Employee, EmployeeStats } from "@/lib/actions/employees"
import { ROLE_LABELS, contractLabel } from "@/lib/utils/constants"

type EmployeeRow = Employee & Record<string, unknown>

interface EmployeeListProps {
  employees: EmployeeRow[]
  stats: EmployeeStats
  canEdit?: boolean
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

function statusBadge(status: EmployeeRow["status"]) {
  if (status === "sick") return <StatusBadge label="Krank" variant="danger" />
  if (status === "vacation") return <StatusBadge label="Urlaub" variant="warning" />
  return <StatusBadge label="Aktiv" variant="success" />
}

const columns: Column<EmployeeRow>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    render: (item) => (
      <Link href={`/mitarbeiter/${item.id}`} className="font-medium text-primary hover:underline">
        {item.first_name} {item.last_name}
      </Link>
    ),
  },
  {
    key: "role",
    header: "Rolle",
    sortable: true,
    render: (item) => <span className="text-sm text-muted-foreground">{roleLabel(item.role)}</span>,
  },
  {
    key: "phone",
    header: "Telefon",
    render: (item) =>
      item.phone ? (
        <a href={`tel:${item.phone}`} className="text-sm text-muted-foreground hover:text-primary">
          {item.phone}
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    key: "status",
    header: "Status",
    render: (item) => statusBadge(item.status),
  },
  {
    key: "contract_type",
    header: "Vertrag",
    render: (item) => (
      <span className="text-sm text-muted-foreground">{contractLabel(item.contract_type)}</span>
    ),
  },
  {
    key: "has_account",
    header: "Account",
    render: (item) =>
      item.has_account ? (
        <StatusBadge label="Aktiv" variant="success" />
      ) : (
        <StatusBadge label="Kein Account" variant="neutral" />
      ),
  },
]

export function EmployeeList({ employees, stats, canEdit = false }: EmployeeListProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-heading text-foreground">Mitarbeiter</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verwalten Sie Ihr Team und deren Qualifikationen.
          </p>
        </div>
        {canEdit && (
          <Link href="/mitarbeiter/neu">
            <Button className="rounded-xl font-semibold">
              <Users className="h-4 w-4 mr-2" />
              Mitarbeiter hinzufuegen
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gesamt"
          value={stats.total}
          context={`${employees.filter((e) => !e.has_account).length} ohne Account`}
          icon={Users}
        />
        <StatCard title="Aktiv" value={stats.active} context="Derzeit im Dienst" icon={UserCheck} />
        <StatCard
          title="Abwesend"
          value={stats.absent}
          context={`${employees.filter((e) => e.status === "sick").length} krank, ${employees.filter((e) => e.status === "vacation").length} Urlaub`}
          icon={UserX}
        />
        <StatCard title="Stunden (Woche)" value={stats.weeklyHours} context="Diese Woche" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Personalkosten/Monat"
          value={formatCurrency(stats.totalMonthlyCost + stats.totalHourlyCost)}
          context={`${formatCurrency(stats.totalMonthlyCost)} Festgehaelter + ${formatCurrency(stats.totalHourlyCost)} Stundenloehne`}
          icon={DollarSign}
        />
        <StatCard
          title="Durchschnitt Stundensatz"
          value={stats.averageHourlyRate > 0 ? formatCurrency(stats.averageHourlyRate) : "–"}
          context="Durchschnitt aller Mitarbeiter"
          icon={Clock}
        />
        <StatCard
          title="Kostentrend"
          value={formatCurrency(stats.costTrend.currentMonth)}
          context="Aktueller Monat"
          icon={TrendingUp}
          trend={
            stats.costTrend.lastMonth > 0
              ? {
                  value: -stats.costTrend.changePercent,
                  label: `vs. Vormonat (${formatCurrency(stats.costTrend.lastMonth)})`,
                }
              : undefined
          }
        />
      </div>

      {/* Table */}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={employees}
            searchKey="last_name"
            searchPlaceholder="Mitarbeiter suchen..."
            pageSize={15}
            emptyState={{
              icon: Users,
              title: "Noch keine Mitarbeiter",
              description: "Fuegen Sie Ihren ersten Mitarbeiter hinzu, um loszulegen.",
              action: { label: "Mitarbeiter hinzufuegen", onClick: () => {} },
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
