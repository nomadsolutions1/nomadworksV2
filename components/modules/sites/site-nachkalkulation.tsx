"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getSiteCosts } from "@/lib/actions/sites"
import type { SiteCosts } from "@/lib/actions/sites"
import { formatCurrency } from "@/lib/utils/format"

interface SiteNachkalkulationProps { siteId: string }

export function SiteNachkalkulation({ siteId }: SiteNachkalkulationProps) {
  const [costs, setCosts] = useState<SiteCosts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getSiteCosts(siteId).then(({ data }) => { setCosts(data ?? null); setLoading(false) }) }, [siteId])

  if (loading) return <Skeleton className="h-64 rounded-2xl" />
  if (!costs) return <p className="text-sm text-muted-foreground">Keine Kostendaten verfügbar.</p>

  const budget = costs.budget ?? 0
  const remaining = budget - costs.totalCosts
  const percent = costs.budgetUsedPercent
  const barColor = percent > 100 ? "bg-danger" : percent > 80 ? "bg-warning" : "bg-success"

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader><CardTitle className="text-base font-semibold">Nachkalkulation</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="pb-2 font-medium">Kategorie</th><th className="pb-2 font-medium text-right">IST-Kosten</th></tr></thead>
            <tbody className="divide-y divide-border">
              {costs.costBreakdown.filter((b) => b.amount > 0).map((b) => (<tr key={b.category}><td className="py-2">{b.category}</td><td className="py-2 text-right font-mono">{formatCurrency(b.amount)}</td></tr>))}
              <tr className="font-semibold border-t-2 border-foreground/20"><td className="pt-3">Gesamt</td><td className="pt-3 text-right font-mono">{formatCurrency(costs.totalCosts)}</td></tr>
            </tbody>
          </table>
        </div>
        {budget > 0 && (
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Budget</span><span className="font-medium">{formatCurrency(budget)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Verbleibend</span><span className={`font-medium ${remaining < 0 ? "text-danger" : "text-success"}`}>{formatCurrency(remaining)}</span></div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground"><span>Auslastung</span><span>{percent}%</span></div>
              <div className="h-2 rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, percent)}%` }} /></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
