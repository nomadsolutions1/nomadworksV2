"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import {
  addInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
} from "@/lib/actions/invoices"
import type { InvoiceItem } from "@/lib/actions/invoices"
import { formatCurrency, formatNumber } from "@/lib/utils/format"
import { Plus, Trash2, Pencil, FileText } from "lucide-react"
import {
  AddItemDialog,
  EditItemDialog,
  DeleteItemDialog,
} from "./invoice-item-dialogs"

interface InvoiceItemsEditorProps {
  invoiceId: string
  items: InvoiceItem[]
  taxRate: number | null
}

export function InvoiceItemsEditor({
  invoiceId,
  items: initialItems,
  taxRate,
}: InvoiceItemsEditorProps) {
  const [items, setItems] = useState(initialItems)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<InvoiceItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const subtotal = items.reduce((sum, i) => sum + i.total, 0)
  const taxAmount = taxRate ? (subtotal * taxRate) / 100 : 0
  const total = subtotal + taxAmount

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("position", String(items.length + 1))
    startTransition(async () => {
      const result = await addInvoiceItem(invoiceId, formData)
      if (result.error) {
        toast.error("Fehler beim Hinzufügen der Position")
        return
      }
      if (result.data) setItems((prev) => [...prev, result.data!])
      toast.success("Position hinzugefügt")
      setIsAddOpen(false)
    })
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editItem) return
    const formData = new FormData(e.currentTarget)
    formData.set("position", String(editItem.position))
    startTransition(async () => {
      const result = await updateInvoiceItem(editItem.id, formData)
      if (result.error) {
        toast.error("Fehler beim Speichern der Position")
        return
      }
      const qty = parseFloat((formData.get("quantity") as string).replace(",", "."))
      const unitPrice = parseFloat((formData.get("unit_price") as string).replace(",", "."))
      setItems((prev) =>
        prev.map((i) =>
          i.id === editItem.id
            ? { ...editItem, description: formData.get("description") as string, unit: (formData.get("unit") as string) || "", quantity: qty, unit_price: unitPrice, total: qty * unitPrice }
            : i
        )
      )
      toast.success("Position gespeichert")
      setEditItem(null)
    })
  }

  async function handleDelete(itemId: string) {
    startTransition(async () => {
      const result = await deleteInvoiceItem(itemId, invoiceId)
      if (result.error) {
        toast.error("Fehler beim Löschen der Position")
        return
      }
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      toast.success("Position gelöscht")
      setDeleteId(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "Position" : "Positionen"}
        </p>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="rounded-xl font-semibold h-9 gap-2 text-sm"
          aria-label="Position hinzufügen"
        >
          <Plus className="h-3.5 w-3.5" />
          Position hinzufügen
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Keine Positionen vorhanden"
          description="Fügen Sie Leistungspositionen hinzu, um den Rechnungsbetrag zu berechnen."
          action={{ label: "Position hinzufügen", onClick: () => setIsAddOpen(true) }}
        />
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
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 even:bg-muted/30">
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.position}</TableCell>
                    <TableCell className="text-sm">{item.description}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(item.quantity)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.unit || "\u2014"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(item.total)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditItem(item)} aria-label={`Position ${item.position} bearbeiten`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:text-danger hover:bg-danger/10" onClick={() => setDeleteId(item.id)} aria-label={`Position ${item.position} löschen`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t bg-muted p-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nettobetrag</span>
                <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {taxRate != null && taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">MwSt. ({taxRate} %)</span>
                  <span className="font-mono font-medium">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold border-t pt-2 mt-2">
                <span className="text-foreground">Gesamtbetrag</span>
                <span className="font-mono text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AddItemDialog open={isAddOpen} onOpenChange={setIsAddOpen} onSubmit={handleAdd} isPending={isPending} />
      <EditItemDialog item={editItem} onClose={() => setEditItem(null)} onSubmit={handleEdit} isPending={isPending} />
      <DeleteItemDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }} onConfirm={() => deleteId && handleDelete(deleteId)} />
    </div>
  )
}
