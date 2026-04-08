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
import { createInvoice, createInvoiceFromOrder } from "@/lib/actions/invoices"
import type { Customer } from "@/lib/actions/customers"
import { Loader2 } from "lucide-react"
import { OrderItemsPreview } from "./order-items-preview"

interface OrderOption {
  id: string
  title: string
  customer_id: string | null
  items?: Array<{
    position: number
    description: string
    unit: string | null
    quantity: number
    unit_price: number
    total: number
  }>
}

interface InvoiceFormProps {
  customers: Customer[]
  orders: OrderOption[]
  defaultTaxRate: number | null
}

export function InvoiceForm({
  customers,
  orders,
  defaultTaxRate,
}: InvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [customerId, setCustomerId] = useState("")
  const [orderId, setOrderId] = useState("")
  const [useOrder, setUseOrder] = useState(false)
  const [taxRate, setTaxRate] = useState(String(defaultTaxRate ?? 19))

  const today = new Date().toISOString().split("T")[0]
  const defaultDueDate = new Date()
  defaultDueDate.setDate(defaultDueDate.getDate() + 14)
  const dueDateDefault = defaultDueDate.toISOString().split("T")[0]

  const availableOrders = customerId
    ? orders.filter((o) => !o.customer_id || o.customer_id === customerId)
    : orders

  const selectedOrder = orderId
    ? orders.find((o) => o.id === orderId)
    : null

  function handleOrderSelect(val: string | null) {
    setOrderId(val ?? "")
    const order = orders.find((o) => o.id === (val ?? ""))
    if (order?.customer_id && !customerId) {
      setCustomerId(order.customer_id)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("customer_id", customerId)
    formData.set("order_id", orderId)
    formData.set("tax_rate", taxRate)

    if (!customerId) {
      toast.error("Bitte wählen Sie einen Kunden aus")
      return
    }

    startTransition(async () => {
      if (useOrder && orderId) {
        const taxRateNum = taxRate ? parseFloat(taxRate) : null
        const result = await createInvoiceFromOrder(
          orderId,
          customerId,
          taxRateNum
        )
        if (result.error) {
          toast.error(
            typeof result.error === "string"
              ? result.error
              : "Fehler beim Erstellen der Rechnung"
          )
          return
        }
        toast.success("Rechnung aus Auftrag erstellt")
        router.push(`/rechnungen/${result.data?.id}`)
      } else {
        const result = await createInvoice(formData)
        if (result.error) {
          toast.error("Fehler beim Erstellen der Rechnung")
          return
        }
        toast.success("Rechnung wurde angelegt")
        router.push(`/rechnungen/${result.data?.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Option: from order */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Rechnungsquelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setUseOrder(false)
                setOrderId("")
              }}
              className={`flex-1 rounded-xl border-2 p-4 text-left transition-colors ${
                !useOrder
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
              aria-label="Leere Rechnung erstellen"
            >
              <p className="text-sm font-semibold text-foreground">
                Leere Rechnung
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Positionen manuell hinzufügen
              </p>
            </button>
            <button
              type="button"
              onClick={() => setUseOrder(true)}
              className={`flex-1 rounded-xl border-2 p-4 text-left transition-colors ${
                useOrder
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
              aria-label="Rechnung aus Auftrag erstellen"
            >
              <p className="text-sm font-semibold text-foreground">
                Aus Auftrag uebernehmen
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Auftragspositionen automatisch einfuegen
              </p>
            </button>
          </div>

          {useOrder && (
            <div className="space-y-1.5">
              <Label>Auftrag auswählen</Label>
              <Select value={orderId} onValueChange={handleOrderSelect}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Auftrag wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {availableOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview order items */}
          {selectedOrder?.items && selectedOrder.items.length > 0 && (
            <OrderItemsPreview items={selectedOrder.items} />
          )}
        </CardContent>
      </Card>

      {/* Grunddaten */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Grunddaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Kunde *</Label>
              <Select
                value={customerId}
                onValueChange={(v: string | null) => setCustomerId(v ?? "")}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Kunde auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoice_date">Rechnungsdatum *</Label>
              <Input
                id="invoice_date"
                name="invoice_date"
                type="date"
                defaultValue={today}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="due_date">Zahlungsziel</Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                defaultValue={dueDateDefault}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tax_rate">Steuersatz (%)</Label>
              <Input
                id="tax_rate"
                name="tax_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="19"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Interne Notizen oder Zahlungshinweise..."
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending || !customerId}
          className="rounded-xl font-semibold h-11 px-6"
          aria-label="Rechnung anlegen"
        >
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Rechnung anlegen
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl h-11"
          onClick={() => router.back()}
          aria-label="Abbrechen"
        >
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
