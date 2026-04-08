"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Package, Wrench, Handshake, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import { getSiteCosts } from "@/lib/actions/sites"
import type { SiteCosts } from "@/lib/actions/sites"

const ICONS = [Users, Package, Wrench, Handshake]

interface SiteCostsTabProps {
  siteId: string
}

export function SiteCostsTab({ siteId }: SiteCostsTabProps) {
  const [costs, setCosts] = useState<SiteCosts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSiteCosts(siteId).then((result) => {
      if (result.data) setCosts(result.data)
      setLoading(false)
    })
  }, [siteId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-28 rounded-2xl" />))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!costs) return <p className="text-sm text-muted-foreground">Kosten konnten nicht geladen werden.</p>

  const budgetBarColor = costs.budgetUsedPercent > 90 ? "bg-danger" : costs.budgetUsedPercent > 70 ? "bg-warning" : "bg-success"
  const budgetTextColor = costs.budgetUsedPercent > 90 ? "text-danger" : costs.budgetUsedPercent > 70 ? "text-warning" : "text-success"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {costs.costBreakdown.map((item, idx) => {
          const Icon = ICONS[idx] ?? Wrench
          return (
            <Card key={item.category} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{item.category}</p>
                    <p className="text-2xl font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-muted-foreground">{item.percentage}% der Gesamtkosten</p>
                  </div>
                  <div className="rounded-xl bg-primary/10 p-3"><Icon className="h-5 w-5 text-primary" /></div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" /> Gesamt: {formatCurrency(costs.totalCosts)}
            {costs.budget && <span className="text-sm font-normal text-muted-foreground">von {formatCurrency(costs.budget)} Budget</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {costs.budget ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Budgetauslastung</span><span className={`font-semibold ${budgetTextColor}`}>{costs.budgetUsedPercent}%</span></div>
              <div className="h-3 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full transition-all ${budgetBarColor}`} style={{ width: `${Math.min(100, costs.budgetUsedPercent)}%` }} /></div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Kein Budget hinterlegt.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
