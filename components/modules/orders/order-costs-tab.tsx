"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/shared/currency-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { addOrderCost, deleteOrderCost } from "@/lib/actions/orders"
import type { OrderCostsByCategory } from "@/lib/actions/orders"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { CATEGORY_LABELS } from "@/lib/utils/constants"
import { Plus, Trash2, Receipt, Loader2 } from "lucide-react"

interface OrderCostsTabProps {
  orderId: string
  costsByCategory: OrderCostsByCategory[]
}

export function OrderCostsTab({ orderId, costsByCategory: initial }: OrderCostsTabProps) {
  const [categories, setCategories] = useState(initial)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedCategory, setSelectedCategory] = useState<string>("personal")
  const totalCosts = categories.reduce((sum, c) => sum + c.total, 0)
  const allItems = categories.flatMap((c) => c.items)

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("category", selectedCategory)
    startTransition(async () => {
      const result = await addOrderCost(orderId, formData)
      if (result.error) { toast.error("Fehler beim Hinzufügen"); return }
      if (result.data) {
        setCategories((prev) => {
          const updated = [...prev]
          const idx = updated.findIndex((c) => c.category === result.data!.category)
          if (idx >= 0) { updated[idx] = { ...updated[idx], total: updated[idx].total + result.data!.amount, items: [result.data!, ...updated[idx].items] } }
          else { updated.push({ category: result.data!.category, total: result.data!.amount, items: [result.data!] }) }
          return updated
        })
      }
      toast.success("Kosteneintrag wurde hinzugefügt")
      setIsAddOpen(false)
    })
  }

  async function handleDelete(costId: string) {
    startTransition(async () => {
      const result = await deleteOrderCost(costId, orderId)
      if (result.error) { toast.error("Fehler beim Löschen"); return }
      setCategories((prev) => prev.map((cat) => { const items = cat.items.filter((i) => i.id !== costId); return { ...cat, items, total: items.reduce((s, i) => s + i.amount, 0) } }).filter((cat) => cat.items.length > 0))
      toast.success("Kosteneintrag wurde gelöscht")
      setDeleteTarget(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{allItems.length} {allItems.length === 1 ? "Eintrag" : "Einträge"} · <span className="font-semibold text-foreground">{formatCurrency(totalCosts)}</span></p>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-xl font-semibold h-9 gap-2 text-sm"><Plus className="h-3.5 w-3.5" /> Kosten eintragen</Button>
      </div>

      {categories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Card key={cat.category} className="rounded-xl shadow-sm">
              <CardContent className="p-3">
                <span className="text-xs font-medium text-muted-foreground">{CATEGORY_LABELS[cat.category] || cat.category}</span>
                <p className="text-base font-semibold font-mono text-foreground">{formatCurrency(cat.total)}</p>
                <p className="text-xs text-muted-foreground">{cat.items.length} {cat.items.length === 1 ? "Eintrag" : "Einträge"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {allItems.length === 0 ? (
        <EmptyState icon={Receipt} title="Keine Kosten erfasst" description="Tragen Sie Kosten manuell ein." action={{ label: "Kosten eintragen", onClick: () => setIsAddOpen(true) }} />
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <Card key={cat.category} className="rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="py-3 px-4 bg-muted border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  {CATEGORY_LABELS[cat.category] || cat.category}
                  <span className="ml-auto font-mono text-primary">{formatCurrency(cat.total)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Beschreibung</TableHead><TableHead className="w-28">Datum</TableHead><TableHead className="w-32 text-right">Betrag</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
                  <TableBody>
                    {cat.items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="text-sm">{item.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(item.date)}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(item.amount)}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10" onClick={() => setDeleteTarget({ id: item.id })}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>Kosten eintragen</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5"><Label>Kategorie</Label><Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v ?? "other")}><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CATEGORY_LABELS).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="description">Beschreibung *</Label><Input id="description" name="description" placeholder="z.B. Betonstahl Lieferung" className="h-11 rounded-xl" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="amount">Betrag (EUR) *</Label><CurrencyInput name="amount" placeholder="0,00" required /></div>
              <div className="space-y-1.5"><Label htmlFor="date">Datum *</Label><Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="h-11 rounded-xl" required /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddOpen(false)}>Abbrechen</Button><Button type="submit" disabled={isPending} className="rounded-xl font-semibold">{isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Eintragen</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent className="rounded-2xl"><AlertDialogHeader><AlertDialogTitle>Kosteneintrag löschen?</AlertDialogTitle><AlertDialogDescription>Dieser Kosteneintrag wird unwiderruflich gelöscht.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel><AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget.id)} variant="destructive" className="rounded-xl font-semibold">Löschen</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
