import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatPercent } from "@/lib/utils/format"
import { CATEGORY_LABELS, DEFAULT_BUDGET_SPLIT } from "@/lib/utils/constants"
import type { OrderFinancials } from "@/lib/actions/orders"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface CostComparisonProps {
  financials: OrderFinancials
  orderValue: number
}

export function CostComparison({ financials, orderValue }: CostComparisonProps) {
  const { budget, totalCosts, margin, marginPercent, costsByCategory } = financials
  const categories = Object.keys(CATEGORY_LABELS)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl shadow-sm"><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground mb-1">Auftragswert (SOLL)</p><p className="text-lg font-semibold font-mono text-primary">{formatCurrency(orderValue > 0 ? orderValue : budget)}</p></CardContent></Card>
        <Card className="rounded-2xl shadow-sm"><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground mb-1">Kosten gesamt (IST)</p><p className="text-lg font-semibold font-mono text-foreground">{formatCurrency(totalCosts)}</p></CardContent></Card>
        <Card className="rounded-2xl shadow-sm"><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground mb-1">Gewinn / Verlust</p><p className={`text-lg font-semibold font-mono ${margin >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(margin)}</p></CardContent></Card>
        <Card className="rounded-2xl shadow-sm"><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground mb-1">Marge</p><div className="flex items-center gap-1.5">{margin > 0 ? <TrendingUp className="h-4 w-4 text-success" /> : margin < 0 ? <TrendingDown className="h-4 w-4 text-danger" /> : <Minus className="h-4 w-4 text-muted-foreground" />}<p className={`text-lg font-semibold font-mono ${margin > 0 ? "text-success" : margin < 0 ? "text-danger" : "text-muted-foreground"}`}>{formatPercent(marginPercent)}</p></div></CardContent></Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader><CardTitle className="text-base font-semibold text-foreground">Kostenvergleich nach Kategorie</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b border-border"><span>Kategorie</span><span className="text-right">SOLL (Budget)</span><span className="text-right">IST (Kosten)</span><span className="text-right">Differenz</span></div>
            {categories.map((cat) => {
              const soll = budget * (DEFAULT_BUDGET_SPLIT[cat] || 0)
              const ist = costsByCategory[cat] || 0
              const diff = soll - ist
              return (
                <div key={cat} className="grid grid-cols-4 gap-4 items-center py-2">
                  <span className="text-sm font-medium text-foreground">{CATEGORY_LABELS[cat]}</span>
                  <span className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(soll)}</span>
                  <span className="text-right font-mono text-sm font-semibold text-foreground">{ist > 0 ? formatCurrency(ist) : "—"}</span>
                  <div className="flex items-center justify-end gap-1">
                    {ist === 0 ? <span className="text-sm text-muted-foreground">—</span> : (
                      <><span className={`text-sm font-mono font-semibold ${diff >= 0 ? "text-success" : "text-danger"}`}>{diff >= 0 ? "+" : ""}{formatCurrency(diff)}</span></>
                    )}
                  </div>
                </div>
              )
            })}
            <div className="grid grid-cols-4 gap-4 items-center pt-3 border-t border-border font-semibold">
              <span className="text-sm text-foreground">Gesamt</span>
              <span className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(budget)}</span>
              <span className="text-right font-mono text-sm text-foreground">{formatCurrency(totalCosts)}</span>
              <div className="flex items-center justify-end gap-1">
                <span className={`text-sm font-mono font-semibold ${margin >= 0 ? "text-success" : "text-danger"}`}>{margin >= 0 ? "+" : ""}{formatCurrency(margin)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
