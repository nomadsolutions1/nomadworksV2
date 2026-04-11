"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/shared/stat-card"
import { getSiteCosts } from "@/lib/actions/sites"
import type { SiteCosts } from "@/lib/actions/sites"
import { formatCurrency } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import { Users, Package, Truck, HardHat } from "lucide-react"

interface SiteNachkalkulationProps {
  siteId: string
}

type Row = {
  label: string
  ist: number
  icon: typeof Users
}

export function SiteNachkalkulation({ siteId }: SiteNachkalkulationProps) {
  const [costs, setCosts] = useState<SiteCosts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getSiteCosts(siteId).then(({ data }) => {
      if (!active) return
      setCosts(data ?? null)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [siteId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (!costs) {
    return <p className="text-sm text-muted-foreground">Keine Kostendaten verfügbar.</p>
  }

  const rows: Row[] = [
    { label: "Lohn", ist: costs.personalCosts, icon: Users },
    { label: "Material", ist: costs.materialCosts, icon: Package },
    { label: "Fuhrpark", ist: costs.equipmentCosts + costs.vehicleCosts, icon: Truck },
    { label: "Subs", ist: costs.subcontractorCosts, icon: HardHat },
  ]

  const plan = costs.effectiveBudget ?? 0
  const planSource: "site" | "order" | "none" =
    costs.budget != null ? "site" : costs.orderBudget != null ? "order" : "none"
  const ist = costs.totalCosts
  const delta = plan - ist
  const percent = costs.budgetUsedPercent

  const deltaTone =
    percent >= 120 ? "danger" : percent >= 100 ? "danger" : percent >= 80 ? "warning" : "success"
  const deltaBg =
    deltaTone === "danger"
      ? "bg-danger/10"
      : deltaTone === "warning"
        ? "bg-warning/10"
        : "bg-success/10"
  const deltaText =
    deltaTone === "danger"
      ? "text-danger"
      : deltaTone === "warning"
        ? "text-warning"
        : "text-success"
  const barColor =
    deltaTone === "danger" ? "bg-danger" : deltaTone === "warning" ? "bg-warning" : "bg-success"

  return (
    <div className="space-y-6">
      {/* 4 StatCards Ist pro Kategorie */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => (
          <StatCard
            key={r.label}
            title={r.label}
            value={formatCurrency(r.ist)}
            icon={r.icon}
            context={ist > 0 ? `${Math.round((r.ist / ist) * 100)}% der Ist-Kosten` : undefined}
          />
        ))}
      </div>

      {/* Delta-Card */}
      <Card className={cn("rounded-2xl shadow-sm", deltaBg)}>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Plan
                {planSource === "order" && (
                  <span className="ml-1 normal-case">(aus Auftrag)</span>
                )}
                {planSource === "none" && <span className="ml-1 normal-case">(nicht gesetzt)</span>}
              </p>
              <p className="text-2xl font-semibold font-heading text-foreground">
                {plan > 0 ? formatCurrency(plan) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ist</p>
              <p className="text-2xl font-semibold font-heading text-foreground">
                {formatCurrency(ist)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Delta
              </p>
              <p className={cn("text-2xl font-semibold font-heading", deltaText)}>
                {plan > 0
                  ? `${delta >= 0 ? "+" : ""}${formatCurrency(delta)}`
                  : "—"}
              </p>
              {plan > 0 && (
                <p className="text-xs text-muted-foreground">
                  {percent}% vom Budget
                </p>
              )}
            </div>
          </div>
          {plan > 0 && (
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan vs Ist pro Kategorie */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Plan vs. Ist pro Kategorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Kategorie</th>
                  <th className="pb-2 font-medium text-right">Ist</th>
                  <th className="pb-2 font-medium text-right">Anteil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td className="py-2 font-medium">{r.label}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(r.ist)}</td>
                    <td className="py-2 text-right font-mono text-muted-foreground">
                      {ist > 0 ? `${Math.round((r.ist / ist) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold border-t-2 border-foreground/20">
                  <td className="pt-3">Gesamt</td>
                  <td className="pt-3 text-right font-mono">{formatCurrency(ist)}</td>
                  <td className="pt-3 text-right font-mono text-muted-foreground">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Hinweis: &bdquo;Fuhrpark&ldquo; fasst Geräte- und Fahrzeugkosten aus `asset_assignments` zusammen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
