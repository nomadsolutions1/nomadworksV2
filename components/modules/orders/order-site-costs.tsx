"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { getOrderSites } from "@/lib/actions/orders"
import { getSiteCosts } from "@/lib/actions/sites"
import { formatCurrency } from "@/lib/utils/format"
import Link from "next/link"
import { Plus } from "lucide-react"
import type { OrderSite } from "@/lib/actions/orders"
import { useEffect } from "react"

type SiteCostRow = OrderSite & { totalCosts: number; usedPercent: number; budgetPercent: number }

interface OrderSiteCostsProps {
  orderId: string
  orderBudget: number | null
  siteCount: number
}

export function OrderSiteCosts({ orderId, orderBudget, siteCount }: OrderSiteCostsProps) {
  const [sites, setSites] = useState<SiteCostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [budgetEdits, setBudgetEdits] = useState<Record<string, number>>({})

  useEffect(() => {
    async function load() {
      const { data: siteList } = await getOrderSites(orderId)
      if (!siteList || siteList.length === 0) { setLoading(false); return }
      const rows: SiteCostRow[] = []
      for (const s of siteList) {
        const { data: costs } = await getSiteCosts(s.id)
        const totalCosts = costs?.totalCosts ?? 0
        const budget = s.budget ?? 0
        rows.push({
          ...s, totalCosts,
          usedPercent: budget > 0 ? Math.round((totalCosts / budget) * 1000) / 10 : 0,
          budgetPercent: orderBudget && orderBudget > 0 ? Math.round((budget / orderBudget) * 1000) / 10 : 0,
        })
      }
      setSites(rows)
      setLoading(false)
    }
    load()
  }, [orderId, orderBudget])

  if (loading) return <Skeleton className="h-48 rounded-2xl" />

  const totalBudget = orderBudget ?? 0
  const totalCosts = sites.reduce((s, r) => s + r.totalCosts, 0)

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Baustellen für diesen Auftrag</CardTitle>
          <Link href={`/baustellen/neu?order_id=${orderId}`}>
            <Button size="sm" className="rounded-lg text-xs h-8"><Plus className="h-3.5 w-3.5 mr-1" /> Baustelle hinzufügen</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {sites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {siteCount === 0 ? "Noch keine Baustellen zugewiesen." : `${siteCount} Baustelle(n) zugewiesen.`}
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {sites.map((s) => {
                  const budget = s.budget ?? 0
                  const percent = budget > 0 ? Math.min(100, s.usedPercent) : 0
                  const barColor = s.usedPercent > 100 ? "bg-danger" : s.usedPercent > 80 ? "bg-warning" : "bg-primary"
                  return (
                    <div key={s.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <Link href={`/baustellen/${s.id}`} className="font-medium text-primary hover:underline">{s.name}</Link>
                        <span className="text-muted-foreground font-mono text-xs">
                          {formatCurrency(s.totalCosts)} / {formatCurrency(budget)} ({s.usedPercent}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">{Math.round(s.budgetPercent)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="pt-4 border-t border-border space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Auftragsbudget</span><span className="font-medium">{formatCurrency(totalBudget)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gesamtkosten</span><span className="font-medium">{formatCurrency(totalCosts)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Verbleibend</span><span className={`font-medium ${totalBudget - totalCosts < 0 ? "text-danger" : "text-success"}`}>{formatCurrency(totalBudget - totalCosts)}</span></div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
