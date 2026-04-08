"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddressFields } from "@/components/shared/address-fields"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateCompanySettings } from "@/lib/actions/settings"
import { Loader2, Save } from "lucide-react"
import type { CompanySettings } from "@/lib/actions/settings"

interface CompanyFormProps {
  settings: CompanySettings
}

export function CompanyForm({ settings }: CompanyFormProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateCompanySettings(formData)
    setLoading(false)

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Fehler beim Speichern")
      return
    }

    toast.success("Firmendaten gespeichert")
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Firmendaten</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Firmenname *</Label>
            <Input id="name" name="name" defaultValue={settings.name} className="h-11 rounded-xl" required />
          </div>
          <AddressFields address={settings.address} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="tax_id">Steuernummer</Label>
              <Input id="tax_id" name="tax_id" defaultValue={settings.tax_id ?? ""} placeholder="12/345/67890" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="trade_license">Gewerbeschein-Nr.</Label>
              <Input id="trade_license" name="trade_license" defaultValue={settings.trade_license ?? ""} className="h-11 rounded-xl" />
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
