"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { getOrderStatusConfig, CATEGORY_LABELS } from "@/lib/utils/constants"
import { Calendar, Plus, Loader2 } from "lucide-react"
import { addChangeOrder } from "@/lib/actions/orders"
import { toast } from "sonner"
import type { Order, OrderFinancials } from "@/lib/actions/orders"

interface OrderOverviewTabProps {
  order: Order
  financials: OrderFinancials
  budget: number
  orderValue: number
}

export function OrderOverviewTab({ order, financials: fin, budget }: OrderOverviewTabProps) {
  const router = useRouter()
  const [showNachtrag, setShowNachtrag] = useState(false)
  const [nachtragPending, setNachtragPending] = useState(false)
  const statusCfg = getOrderStatusConfig(order.status)

  async function handleAddNachtrag(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const description = fd.get("description") as string
    const amount = parseFloat(fd.get("amount") as string)
    if (!description || !amount) return
    setNachtragPending(true)
    const result = await addChangeOrder(order.id, description, amount)
    setNachtragPending(false)
    if (result.error) { toast.error(result.error); return }
    toast.success("Nachtrag hinzugefügt")
    setShowNachtrag(false)
    router.refresh()
  }

  const budgetBarColor = fin.budgetUsedPercent > 100 ? "bg-danger" : fin.budgetUsedPercent > 80 ? "bg-warning" : "bg-success"
  const budgetTextColor = fin.budgetUsedPercent > 100 ? "text-danger" : fin.budgetUsedPercent > 80 ? "text-warning" : "text-success"

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold text-foreground">Auftragsdetails</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border"><span className="text-sm text-muted-foreground">Status</span><StatusBadge label={statusCfg.label} variant={statusCfg.variant} /></div>
            <div className="flex items-center justify-between py-2 border-b border-border"><span className="text-sm text-muted-foreground">Kunde</span><span className="text-sm font-medium text-foreground">{order.customer_name || "—"}</span></div>
            <div className="flex items-center justify-between py-2 border-b border-border"><span className="text-sm text-muted-foreground">Baustellen</span><span className="text-sm font-medium text-foreground">{order.site_count ?? 0}</span></div>
            <div className="flex items-center justify-between py-2 border-b border-border"><span className="text-sm text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Startdatum</span><span className="text-sm font-medium text-foreground">{order.start_date ? formatDate(order.start_date) : "—"}</span></div>
            <div className="flex items-center justify-between py-2 border-b border-border"><span className="text-sm text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Enddatum</span><span className="text-sm font-medium text-foreground">{order.end_date ? formatDate(order.end_date) : "—"}</span></div>
            <div className="flex items-center justify-between py-2"><span className="text-sm text-muted-foreground">Budget</span><span className="text-sm font-mono font-semibold text-primary">{order.budget != null ? formatCurrency(order.budget) : "—"}</span></div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold text-foreground">Budgetauslastung</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{formatCurrency(fin.totalCosts)} von {formatCurrency(budget)}</span>
                <span className={`text-sm font-semibold ${budgetTextColor}`}>{Math.round(fin.budgetUsedPercent)}%</span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div className={`h-3 rounded-full transition-all ${budgetBarColor}`} style={{ width: `${Math.min(fin.budgetUsedPercent, 100)}%` }} />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              {Object.entries(fin.costsByCategory).filter(([, v]) => v > 0).map(([cat, amount]) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{CATEGORY_LABELS[cat] || cat}</span>
                  <span className="font-mono font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
              {fin.totalCosts === 0 && <p className="text-sm text-muted-foreground text-center py-4">Noch keine Kosten erfasst</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {order.description && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold text-foreground">Beschreibung</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.description}</p></CardContent>
        </Card>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Budget & Nachträge</CardTitle>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setShowNachtrag(true)}><Plus className="h-3 w-3 mr-1" /> Nachtrag</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Original-Budget:</span><span className="font-mono font-semibold">{formatCurrency(order.original_budget || order.budget || 0)}</span></div>
          {order.change_order_notes && (<div className="bg-muted rounded-xl p-3 mt-2"><p className="text-xs font-medium text-foreground mb-1">Nachträge:</p><p className="text-xs text-muted-foreground whitespace-pre-wrap">{order.change_order_notes}</p></div>)}
          <div className="flex justify-between text-sm pt-2 border-t border-border"><span className="font-medium text-foreground">Aktuelles Budget:</span><span className="font-mono font-semibold text-primary">{formatCurrency(order.budget || 0)}</span></div>
        </CardContent>
      </Card>

      <Dialog open={showNachtrag} onOpenChange={setShowNachtrag}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Nachtrag hinzufügen</DialogTitle></DialogHeader>
          <form onSubmit={handleAddNachtrag} className="space-y-4">
            <div className="space-y-1.5"><Label>Beschreibung</Label><Textarea name="description" placeholder="z.B. Zusätzliche Erdarbeiten" className="rounded-xl" required /></div>
            <div className="space-y-1.5"><Label>Betrag (EUR)</Label><Input name="amount" type="number" step="0.01" min="0" placeholder="z.B. 15000" className="h-11 rounded-xl" required /></div>
            <Button type="submit" className="w-full rounded-xl font-semibold h-11" disabled={nachtragPending}>
              {nachtragPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Nachtrag hinzufügen
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
