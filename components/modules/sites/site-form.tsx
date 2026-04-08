"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createSite, updateSite } from "@/lib/actions/sites"
import { getAvailableBudget } from "@/lib/actions/orders"
import { formatCurrency } from "@/lib/utils/format"
import { AddressFields } from "@/components/shared/address-fields"
import { CurrencyInput } from "@/components/shared/currency-input"
import type { Site, SiteForeman } from "@/lib/actions/sites"
import { Loader2 } from "lucide-react"

interface OrderOption { id: string; title: string; budget: number | null }

interface SiteFormProps {
  site?: Site
  foremanList: SiteForeman[]
  orders?: OrderOption[]
  mode: "create" | "edit"
}

export function SiteForm({ site, foremanList, orders = [], mode }: SiteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string>(site?.status ?? "active")
  const [siteManager, setSiteManager] = useState<string>(site?.site_manager ?? "")
  const [orderId, setOrderId] = useState<string>(site?.order_id ?? "")
  const [budgetInfo, setBudgetInfo] = useState<{ total: number; assigned: number; available: number } | null>(null)

  useEffect(() => {
    if (orderId) { getAvailableBudget(orderId).then(({ data }) => setBudgetInfo(data ?? null)) }
    else { setBudgetInfo(null) }
  }, [orderId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("status", status)
    formData.set("site_manager", siteManager)
    formData.set("order_id", orderId)
    startTransition(async () => {
      if (mode === "create") {
        const result = await createSite(formData)
        if (result.error) { toast.error("Fehler beim Erstellen"); return }
        toast.success("Baustelle wurde erfolgreich angelegt")
        router.push("/baustellen")
      } else if (site) {
        const result = await updateSite(site.id, formData)
        if (result.error) { toast.error("Fehler beim Speichern"); return }
        toast.success("Aenderungen wurden gespeichert")
        router.refresh()
      }
    })
  }

  const statusLabels: Record<string, string> = { active: "Aktiv", paused: "Pausiert", completed: "Abgeschlossen" }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {orders.length > 0 && mode === "create" && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold text-foreground">Auftrag auswaehlen</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={orderId} onValueChange={(v) => setOrderId(v ?? "")}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Auftrag auswaehlen">{(value) => orders.find((o) => o.id === value)?.title ?? "Auftrag auswaehlen"}</SelectValue></SelectTrigger>
              <SelectContent>{orders.map((o) => (<SelectItem key={o.id} value={o.id}>{o.title}{o.budget ? ` — ${formatCurrency(o.budget)}` : ""}</SelectItem>))}</SelectContent>
            </Select>
            {!orderId && <p className="text-sm text-muted-foreground">Waehlen Sie zuerst einen Auftrag aus.</p>}
          </CardContent>
        </Card>
      )}
      {orderId && budgetInfo && (
        <Card className="rounded-2xl shadow-sm border-primary/10 bg-primary/5">
          <CardContent className="pt-4 pb-4 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Auftragsbudget:</span><span className="font-semibold">{formatCurrency(budgetInfo.total)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bereits zugewiesen:</span><span>{formatCurrency(budgetInfo.assigned)}</span></div>
            <div className="flex justify-between text-sm pt-1 border-t border-primary/10"><span className="font-medium text-primary">Verfuegbar:</span><span className="font-semibold text-primary">{formatCurrency(budgetInfo.available)}</span></div>
          </CardContent>
        </Card>
      )}
      {(orderId || mode === "edit") && (
        <>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle className="text-base font-semibold text-foreground">Grunddaten</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1.5"><Label htmlFor="name">Name der Baustelle *</Label><Input id="name" name="name" defaultValue={site?.name ?? ""} placeholder="z.B. Neubau Hauptstrasse 12" className="h-11 rounded-xl" required /></div>
                <div className="sm:col-span-2"><AddressFields address={site?.address} /></div>
                <div className="space-y-1.5"><Label>Status</Label><Select value={status} onValueChange={(v) => { if (v) setStatus(v) }}><SelectTrigger className="h-11 rounded-xl"><SelectValue>{(value) => statusLabels[value as string] ?? "Status waehlen"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="active">Aktiv</SelectItem><SelectItem value="paused">Pausiert</SelectItem><SelectItem value="completed">Abgeschlossen</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Budget</Label><CurrencyInput name="budget" defaultValue={site?.budget} placeholder={budgetInfo ? `max. ${formatCurrency(budgetInfo.available)}` : "z.B. 500.000,00"} max={budgetInfo?.available ?? undefined} /></div>
                <div className="space-y-1.5"><Label htmlFor="start_date">Startdatum</Label><Input id="start_date" name="start_date" type="date" defaultValue={site?.start_date ?? ""} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label htmlFor="end_date">Enddatum</Label><Input id="end_date" name="end_date" type="date" defaultValue={site?.end_date ?? ""} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Bauleiter</Label><Select value={siteManager} onValueChange={(v) => setSiteManager(v ?? "")}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Bauleiter waehlen">{(value) => { if (!value) return "Bauleiter waehlen"; return foremanList.find((f) => f.id === value)?.name ?? "Bauleiter waehlen" }}</SelectValue></SelectTrigger><SelectContent><SelectItem value="">Kein Bauleiter</SelectItem>{foremanList.map((f) => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}</SelectContent></Select></div>
                <div className="sm:col-span-2 space-y-1.5"><Label htmlFor="description">Beschreibung</Label><Textarea id="description" name="description" defaultValue={site?.description ?? ""} placeholder="Kurze Beschreibung..." rows={3} className="rounded-xl resize-none" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle className="text-base font-semibold text-foreground">Auftraggeber</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="client_name">Name / Firma</Label><Input id="client_name" name="client_name" defaultValue={site?.client_name ?? ""} placeholder="z.B. Mustermann GmbH" className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label htmlFor="client_phone">Telefon</Label><Input id="client_phone" name="client_phone" type="tel" defaultValue={site?.client_phone ?? ""} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label htmlFor="client_email">E-Mail</Label><Input id="client_email" name="client_email" type="email" defaultValue={site?.client_email ?? ""} className="h-11 rounded-xl" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle className="text-base font-semibold text-foreground">Ansprechpartner vor Ort</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5"><Label htmlFor="contact_name">Name</Label><Input id="contact_name" name="contact_name" defaultValue={site?.contact_name ?? ""} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label htmlFor="contact_phone">Telefon</Label><Input id="contact_phone" name="contact_phone" type="tel" defaultValue={site?.contact_phone ?? ""} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label htmlFor="contact_role">Rolle</Label><Input id="contact_role" name="contact_role" defaultValue={site?.contact_role ?? ""} className="h-11 rounded-xl" /></div>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending} className="rounded-xl font-semibold h-11 px-6">{isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{mode === "create" ? "Baustelle anlegen" : "Aenderungen speichern"}</Button>
            <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => router.back()}>Abbrechen</Button>
          </div>
        </>
      )}
    </form>
  )
}
