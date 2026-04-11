"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { createPurchaseOrder, addPurchaseOrderItem } from "@/lib/actions/inventory"
import { formatCurrency } from "@/lib/utils/format"
import type { Supplier, Material } from "@/lib/actions/inventory"

interface POFormProps {
  suppliers: Supplier[]
  materials: Material[]
}

interface LineItem {
  key: string
  materialId: string
  quantity: string
  unitPrice: string
}

export function PurchaseOrderForm({ suppliers, materials }: POFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [supplierId, setSupplierId] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { key: crypto.randomUUID(), materialId: "", quantity: "", unitPrice: "" },
  ])

  const today = new Date().toISOString().split("T")[0]

  function addLine() {
    setLineItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), materialId: "", quantity: "", unitPrice: "" },
    ])
  }

  function removeLine(key: string) {
    setLineItems((prev) => prev.filter((l) => l.key !== key))
  }

  function updateLine(key: string, field: keyof Omit<LineItem, "key">, value: string) {
    setLineItems((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const updated = { ...l, [field]: value }
        if (field === "materialId") {
          const mat = materials.find((m) => m.id === value)
          if (mat?.price_per_unit != null) {
            updated.unitPrice = mat.price_per_unit.toString()
          }
        }
        return updated
      })
    )
  }

  const total = lineItems.reduce((sum, l) => {
    const q = parseFloat(l.quantity.replace(",", ".")) || 0
    const p = parseFloat(l.unitPrice.replace(",", ".")) || 0
    return sum + q * p
  }, 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    formData.set("supplier_id", supplierId)

    if (!supplierId) {
      toast.error("Bitte wählen Sie einen Lieferanten")
      return
    }

    const validLines = lineItems.filter((l) => l.materialId && l.quantity && l.unitPrice)
    if (validLines.length === 0) {
      toast.error("Bitte fügen Sie mindestens eine Bestellposition hinzu")
      return
    }

    startTransition(async () => {
      const result = await createPurchaseOrder(formData)
      if (result?.error) {
        if (typeof result.error === "string") {
          toast.error(result.error)
        } else {
          setFieldErrors(result.error)
          toast.error("Bitte prüfen Sie Ihre Eingaben")
        }
        return
      }

      if (!result?.id) return

      // Add items sequentially
      for (const line of validLines) {
        const itemForm = new FormData()
        itemForm.set("material_id", line.materialId)
        itemForm.set("quantity", line.quantity)
        itemForm.set("unit_price", line.unitPrice)
        await addPurchaseOrderItem(result.id, itemForm)
      }

      toast.success("Bestellung erfolgreich angelegt")
      router.push(`/lager/bestellungen/${result.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Bestelldetails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Lieferant *</Label>
              <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Lieferant wählen">
                    {(value) => suppliers.find((s) => s.id === value)?.name ?? "Lieferant wählen"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.supplier_id && (
                <p className="text-xs text-danger">{fieldErrors.supplier_id[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order_date">Bestelldatum *</Label>
              <Input
                id="order_date"
                name="order_date"
                type="date"
                defaultValue={today}
                className="h-11 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Lieferhinweise, Sonderwünsche..."
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Bestellpositionen</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLine}
            className="rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Position
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lineItems.map((line) => {
            const mat = materials.find((m) => m.id === line.materialId)
            const lineTotal =
              (parseFloat(line.quantity.replace(",", ".")) || 0) *
              (parseFloat(line.unitPrice.replace(",", ".")) || 0)
            return (
              <div
                key={line.key}
                className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl bg-muted border border-border"
              >
                <div className="col-span-12 sm:col-span-5 space-y-1">
                  <Label className="text-xs text-muted-foreground">Material</Label>
                  <Select
                    value={line.materialId}
                    onValueChange={(v) => updateLine(line.key, "materialId", v ?? "")}
                  >
                    <SelectTrigger className="h-9 rounded-lg text-sm">
                      <SelectValue placeholder="Material wählen">
                        {(value) =>
                          materials.find((m) => m.id === value)?.name ?? "Material wählen"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Menge {mat ? `(${mat.unit})` : ""}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, "quantity", e.target.value)}
                    placeholder="0"
                    className="h-9 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Einzelpreis (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.key, "unitPrice", e.target.value)}
                    placeholder="0,00"
                    className="h-9 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-3 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Gesamt</Label>
                  <div className="h-9 flex items-center px-3 text-sm font-medium text-foreground">
                    {lineTotal > 0 ? formatCurrency(lineTotal) : "—"}
                  </div>
                </div>
                <div className="col-span-1 flex items-end pb-0.5">
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(line.key)}
                      className="h-9 w-9 rounded-lg text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}

          {total > 0 && (
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Bestellsumme:</span>
              <span className="text-lg font-semibold text-foreground font-mono">
                {formatCurrency(total)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Abbrechen
        </Button>
        <Button type="submit" className="rounded-xl font-semibold" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Bestellung anlegen
        </Button>
      </div>
    </form>
  )
}
