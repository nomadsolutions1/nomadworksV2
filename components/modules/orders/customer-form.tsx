"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddressFields } from "@/components/shared/address-fields"
import { createCustomer, updateCustomer } from "@/lib/actions/customers"
import type { Customer } from "@/lib/actions/customers"
import { Loader2 } from "lucide-react"

interface CustomerFormProps {
  customer?: Customer
  mode: "create" | "edit"
}

export function CustomerForm({ customer, mode }: CustomerFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      if (mode === "create") {
        const result = await createCustomer(formData)
        if (result.error) { toast.error("Fehler beim Erstellen des Kunden"); return }
        toast.success("Kunde wurde erfolgreich angelegt")
        router.push("/auftraege/kunden")
      } else if (customer) {
        const result = await updateCustomer(customer.id, formData)
        if (result.error) { toast.error("Fehler beim Speichern"); return }
        toast.success("Aenderungen wurden gespeichert")
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader><CardTitle className="text-base font-semibold text-foreground">Kontaktdaten</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5"><Label htmlFor="name">Firmenname / Name *</Label><Input id="name" name="name" defaultValue={customer?.name ?? ""} placeholder="z.B. Mustermann Bau GmbH" className="h-11 rounded-xl" required /></div>
            <div className="space-y-1.5"><Label htmlFor="contact_person">Ansprechpartner</Label><Input id="contact_person" name="contact_person" defaultValue={customer?.contact_person ?? ""} placeholder="z.B. Max Mustermann" className="h-11 rounded-xl" /></div>
            <div className="space-y-1.5"><Label htmlFor="email">E-Mail</Label><Input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} placeholder="kontakt@beispiel.de" className="h-11 rounded-xl" /></div>
            <div className="space-y-1.5"><Label htmlFor="phone">Telefon</Label><Input id="phone" name="phone" type="tel" defaultValue={customer?.phone ?? ""} placeholder="+49 170 1234567" className="h-11 rounded-xl" /></div>
            <div className="space-y-1.5"><Label htmlFor="tax_id">USt-IdNr.</Label><Input id="tax_id" name="tax_id" defaultValue="" placeholder="DE123456789" className="h-11 rounded-xl font-mono" /></div>
            <div className="sm:col-span-2"><AddressFields address={customer?.address} /></div>
            <div className="sm:col-span-2 space-y-1.5"><Label htmlFor="notes">Notizen</Label><Textarea id="notes" name="notes" defaultValue={customer?.notes ?? ""} placeholder="Interne Notizen zum Kunden..." rows={3} className="rounded-xl resize-none" /></div>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending} className="rounded-xl font-semibold h-11 px-6">{isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{mode === "create" ? "Kunde anlegen" : "Aenderungen speichern"}</Button>
        <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => router.back()}>Abbrechen</Button>
      </div>
    </form>
  )
}
