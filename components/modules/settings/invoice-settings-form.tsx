"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateInvoiceSettings } from "@/lib/actions/settings"
import { Loader2, Save } from "lucide-react"
import type { CompanySettings } from "@/lib/actions/settings"

interface InvoiceSettingsFormProps {
  settings: CompanySettings
}

export function InvoiceSettingsForm({ settings }: InvoiceSettingsFormProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateInvoiceSettings(formData)
    setLoading(false)

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Fehler beim Speichern")
      return
    }

    toast.success("Rechnungseinstellungen gespeichert")
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Rechnungseinstellungen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="invoice_prefix">Rechnungspräfix *</Label>
              <Input id="invoice_prefix" name="invoice_prefix" defaultValue={settings.invoice_prefix ?? "RE"} className="h-11 rounded-xl" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="default_tax_rate">Steuersatz (%)</Label>
              <Input id="default_tax_rate" name="default_tax_rate" type="number" step="0.01" defaultValue={settings.default_tax_rate ?? 19} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="payment_terms_days">Zahlungsziel (Tage)</Label>
              <Input id="payment_terms_days" name="payment_terms_days" type="number" defaultValue={settings.payment_terms_days ?? 14} className="h-11 rounded-xl" />
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-foreground mb-3">Bankverbindung</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="bank_name">Bank</Label>
                <Input id="bank_name" name="bank_name" defaultValue={settings.bank_name ?? ""} placeholder="Sparkasse Berlin" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bank_iban">IBAN</Label>
                <Input id="bank_iban" name="bank_iban" defaultValue={settings.bank_iban ?? ""} placeholder="DE89 3704 0044 0532 0130 00" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bank_bic">BIC</Label>
                <Input id="bank_bic" name="bank_bic" defaultValue={settings.bank_bic ?? ""} placeholder="COBADEFFXXX" className="h-11 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/80 font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Speichern
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
