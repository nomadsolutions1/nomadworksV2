"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AddressFields } from "@/components/shared/address-fields"
import { CurrencyInput } from "@/components/shared/currency-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createOrder, updateOrder } from "@/lib/actions/orders"
import { createCustomer } from "@/lib/actions/customers"
import type { Order } from "@/lib/actions/orders"
import type { Customer } from "@/lib/actions/customers"
import { Loader2, Plus } from "lucide-react"
import { ORDER_STATUSES, getOrderStatusConfig } from "@/lib/utils/constants"

interface OrderFormProps {
  order?: Order
  customers: Customer[]
  mode: "create" | "edit"
}

export function OrderForm({ order, customers: initialCustomers, mode }: OrderFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string>(order?.status ?? "offer")
  const [customerId, setCustomerId] = useState<string>(order?.customer_id || "")
  const [customers, setCustomers] = useState(initialCustomers)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [sheetPending, setSheetPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("status", status)
    formData.set("customer_id", customerId)
    startTransition(async () => {
      if (mode === "create") {
        const result = await createOrder(formData)
        if (result.error) { toast.error(typeof result.error === "string" ? result.error : "Fehler beim Erstellen"); return }
        toast.success("Auftrag wurde erfolgreich angelegt")
        router.push(result.data?.id ? `/auftraege/${result.data.id}` : "/auftraege")
      } else if (order) {
        const result = await updateOrder(order.id, formData)
        if (result.error) { toast.error("Fehler beim Speichern"); return }
        toast.success("Aenderungen wurden gespeichert")
        router.refresh()
      }
    })
  }

  async function handleCreateCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSheetPending(true)
    const fd = new FormData(e.currentTarget)
    const result = await createCustomer(fd)
    setSheetPending(false)
    if (result.error) { toast.error("Fehler beim Erstellen des Kunden"); return }
    if (result.data) { setCustomers((prev) => [...prev, result.data!]); setCustomerId(result.data.id); toast.success("Kunde angelegt") }
    setShowNewCustomer(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold text-foreground">Grunddaten</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="title">Auftragsbezeichnung *</Label>
                <Input id="title" name="title" defaultValue={order?.title ?? ""} placeholder="z.B. Neubau Einfamilienhaus" className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <Label>Kunde</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Kunde waehlen">{(value) => customers.find((c) => c.id === value)?.name ?? "Kunde waehlen"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Kein Kunde</SelectItem>
                        {customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={() => setShowNewCustomer(true)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v ?? "offer")}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Status waehlen">{(value) => getOrderStatusConfig(value as string).label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORDER_STATUSES).map(([key, val]) => (<SelectItem key={key} value={key}>{val.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Budget</Label><CurrencyInput name="budget" defaultValue={order?.budget} placeholder="z.B. 125.000,00" /></div>
              <div className="space-y-1.5"><Label htmlFor="start_date">Startdatum</Label><Input id="start_date" name="start_date" type="date" defaultValue={order?.start_date ?? ""} className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label htmlFor="end_date">Enddatum</Label><Input id="end_date" name="end_date" type="date" defaultValue={order?.end_date ?? ""} className="h-11 rounded-xl" /></div>
              <div className="sm:col-span-2 space-y-1.5"><Label htmlFor="description">Beschreibung</Label><Textarea id="description" name="description" defaultValue={order?.description ?? ""} placeholder="Kurze Beschreibung des Auftrags..." rows={4} className="rounded-xl resize-none" /></div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending} className="rounded-xl font-semibold h-11 px-6">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "create" ? "Auftrag anlegen" : "Aenderungen speichern"}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => router.back()}>Abbrechen</Button>
        </div>
      </form>
      <Sheet open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <SheetContent side="right" className="w-[480px] bg-background p-0 border-none overflow-y-auto">
          <div className="p-6 border-b border-border">
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold text-foreground">Neuen Kunden anlegen</SheetTitle>
              <p className="text-sm text-muted-foreground">Erstellen Sie einen neuen Kunden fuer diesen Auftrag.</p>
            </SheetHeader>
          </div>
          <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
            <div className="space-y-1.5"><Label htmlFor="c_name">Name / Firma *</Label><Input id="c_name" name="name" placeholder="Musterbau GmbH" className="h-11 rounded-xl" required /></div>
            <div className="space-y-1.5"><Label htmlFor="c_contact">Ansprechpartner</Label><Input id="c_contact" name="contact_person" placeholder="Max Mustermann" className="h-11 rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="c_email">E-Mail</Label><Input id="c_email" name="email" type="email" placeholder="info@firma.de" className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label htmlFor="c_phone">Telefon</Label><Input id="c_phone" name="phone" placeholder="+49 203 123456" className="h-11 rounded-xl" /></div>
            </div>
            <AddressFields />
            <div className="space-y-1.5"><Label htmlFor="c_notes">Notizen</Label><Textarea id="c_notes" name="notes" placeholder="Interne Hinweise..." className="rounded-xl resize-none" rows={2} /></div>
            <Button type="submit" disabled={sheetPending} className="w-full rounded-xl font-semibold h-11">
              {sheetPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Kunde speichern
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
