"use client"

import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/format"
import {
  Users,
  MapPin,
  FileText,
  Clock,
  TrendingUp,
  Receipt,
} from "lucide-react"
import type { DashboardKPIs } from "@/lib/actions/dashboard"

interface DashboardKPIsProps {
  kpis: DashboardKPIs
  utilization: number
}

export function DashboardKPICards({ kpis, utilization }: DashboardKPIsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Mitarbeiter"
          value={kpis.employees.total}
          context={`${kpis.employees.active} aktiv${kpis.employees.sick > 0 ? `, ${kpis.employees.sick} krank` : ""}${kpis.employees.vacation > 0 ? `, ${kpis.employees.vacation} Urlaub` : ""}`}
          icon={Users}
        />
        <StatCard
          title="Baustellen"
          value={kpis.sites.total}
          context={`${kpis.sites.active} aktiv${kpis.sites.paused > 0 ? `, ${kpis.sites.paused} pausiert` : ""}`}
          icon={MapPin}
        />
        <StatCard
          title="Auftraege"
          value={kpis.orders.total}
          context={`${kpis.orders.offers} Angebote, ${kpis.orders.inProgress} in Arbeit, ${kpis.orders.completed} abgeschlossen`}
          icon={FileText}
        />
        <StatCard
          title="Stunden heute"
          value={kpis.hoursToday.total}
          context={`${kpis.hoursToday.clockedIn} Mitarbeiter eingestempelt`}
          icon={Clock}
        />
        <StatCard
          title="Umsatz (Monat)"
          value={formatCurrency(kpis.revenueMonth.total)}
          context={`${kpis.revenueMonth.invoiceCount} Rechnungen, ${kpis.revenueMonth.openCount} offen`}
          icon={TrendingUp}
        />
        <StatCard
          title="Offene Rechnungen"
          value={formatCurrency(kpis.openInvoices.total)}
          context={`${kpis.openInvoices.count} Rechnungen${kpis.openInvoices.overdueCount > 0 ? `, ${kpis.openInvoices.overdueCount} ueberfaellig` : ""}`}
          icon={Receipt}
        />
      </div>

      {/* Utilization Bar */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Auslastung heute
              </p>
              <p className="text-xs text-muted-foreground">
                {kpis.hoursToday.clockedIn} von {kpis.employees.total}{" "}
                Mitarbeitern eingestempelt
              </p>
            </div>
            <span className="text-2xl font-semibold font-heading text-foreground">
              {utilization}%
            </span>
          </div>
          <div
            className="relative h-3 rounded-full bg-border overflow-hidden"
            role="progressbar"
            aria-valuenow={utilization}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Auslastung ${utilization} Prozent`}
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                utilization >= 80
                  ? "bg-success"
                  : utilization >= 60
                    ? "bg-primary"
                    : utilization >= 30
                      ? "bg-accent"
                      : "bg-danger"
              }`}
              style={{ width: `${Math.min(100, utilization)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
