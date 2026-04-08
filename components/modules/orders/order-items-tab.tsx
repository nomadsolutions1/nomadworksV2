"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { addOrderItem, deleteOrderItem, updateOrderItem } from "@/lib/actions/orders"
import type { OrderItem } from "@/lib/actions/orders"
import { formatCurrency, formatNumber } from "@/lib/utils/format"
import { Plus, Trash2, FileText, Loader2, Pencil } from "lucide-react"

interface OrderItemsTabProps {
  orderId: string
  items: OrderItem[]
}

export function OrderItemsTab({ orderId, items: initialItems }: OrderItemsTabProps) {
  const [items, setItems] = useState(initialItems)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<OrderItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("position", String(items.length + 1))
    startTransition(async () => {
      const result = await addOrderItem(orderId, formData)
      if (result.error) { toast.error("Fehler beim Hinzufuegen"); return }
      if (result.data) setItems((prev) => [...prev, result.data!])
      toast.success("Position wurde hinzugefuegt")
      setIsAddOpen(false)
    })
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editItem) return
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateOrderItem(editItem.id, orderId, formData)
      if (result.error) { toast.error("Fehler beim Aktualisieren"); return }
      // Optimistic update from form values
      const desc = formData.get("description") as string
      const qty = parseFloat(formData.get("quantity") as string)
      const unitVal = formData.get("unit") as string
      const price = parseFloat(formData.get("unit_price") as string)
      setItems((prev) => prev.map((i) => i.id === editItem.id ? { ...i, description: desc, quantity: qty, unit: unitVal, unit_price: price } : i))
      toast.success("Position wurde aktualisiert")
      setEditItem(null)
    })
  }

  async function handleDelete(itemId: string) {
    startTransition(async () => {
      const result = await deleteOrderItem(itemId, orderId)
      if (result.error) { toast.error("Fehler beim Loeschen"); return }
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      toast.success("Position wurde geloescht")
      setDeleteId(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "Position" : "Positionen"} · <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
        </p>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-xl font-semibold h-9 gap-2 text-sm"><Plus className="h-3.5 w-3.5" /> Position hinzufuegen</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={FileText} title="Keine Positionen vorhanden" description="Fuegen Sie Leistungspositionen hinzu." action={{ label: "Position hinzufuegen", onClick: () => setIsAddOpen(true) }} />
      ) : (
        <Card className="rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="w-12">Pos.</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="w-20 text-right">Menge</TableHead>
                  <TableHead className="w-20">Einheit</TableHead>
                  <TableHead className="w-28 text-right">EP</TableHead>
                  <TableHead className="w-32 text-right">Gesamt</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 even:bg-muted/30">
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.position}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(item.quantity)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(item.quantity * item.unit_price)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => setEditItem(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10" onClick={() => setDeleteId(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-primary/5 font-semibold">
                  <TableCell colSpan={5} className="text-right text-sm">Auftragswert gesamt</TableCell>
                  <TableCell className="text-right font-mono text-sm text-primary">{formatCurrency(totalValue)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>Position hinzufuegen</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="description">Beschreibung *</Label><Input id="description" name="description" placeholder="z.B. Betonarbeiten Fundament" className="h-11 rounded-xl" required /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label htmlFor="quantity">Menge *</Label><Input id="quantity" name="quantity" type="number" step="0.01" min="0" placeholder="1" className="h-11 rounded-xl" required /></div>
              <div className="space-y-1.5"><Label htmlFor="unit">Einheit *</Label><Input id="unit" name="unit" placeholder="m2, Std., Stk." className="h-11 rounded-xl" required /></div>
              <div className="space-y-1.5"><Label htmlFor="unit_price">EP (EUR) *</Label><Input id="unit_price" name="unit_price" type="number" step="0.01" min="0" placeholder="0.00" className="h-11 rounded-xl" required /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddOpen(false)}>Abbrechen</Button>
              <Button type="submit" disabled={isPending} className="rounded-xl font-semibold">{isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Hinzufuegen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null) }}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>Position bearbeiten</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1.5"><Label>Beschreibung *</Label><Input name="description" defaultValue={editItem?.description} className="h-11 rounded-xl" required /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Menge *</Label><Input name="quantity" type="number" step="0.01" min="0" defaultValue={editItem?.quantity} className="h-11 rounded-xl" required /></div>
              <div className="space-y-1.5"><Label>Einheit *</Label><Input name="unit" defaultValue={editItem?.unit} className="h-11 rounded-xl" required /></div>
              <div className="space-y-1.5"><Label>EP (EUR) *</Label><Input name="unit_price" type="number" step="0.01" min="0" defaultValue={editItem?.unit_price} className="h-11 rounded-xl" required /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditItem(null)}>Abbrechen</Button>
              <Button type="submit" disabled={isPending} className="rounded-xl font-semibold">{isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Speichern</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent className="rounded-2xl"><AlertDialogHeader><AlertDialogTitle>Position loeschen?</AlertDialogTitle><AlertDialogDescription>Diese Position wird unwiderruflich geloescht.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} variant="destructive" className="rounded-xl font-semibold">Loeschen</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
