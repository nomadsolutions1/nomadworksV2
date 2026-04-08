"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateTaxAdvisorSettings } from "@/lib/actions/settings"
import { Loader2, Save, Receipt, Eye } from "lucide-react"
import { updateAccountantPermissions } from "@/lib/actions/settings"
import { cn } from "@/lib/utils"
import type { CompanySettings } from "@/lib/actions/settings"

interface TaxAdvisorFormProps {
  settings: CompanySettings
}

export function TaxAdvisorForm({ settings }: TaxAdvisorFormProps) {
  const [loading, setLoading] = useState(false)
  const [accountantMode, setAccountantMode] = useState<"accounting" | "full">("accounting")
  const [savingMode, setSavingMode] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateTaxAdvisorSettings(formData)
    setLoading(false)

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Fehler beim Speichern")
      return
    }

    toast.success("Steuerberater-Daten gespeichert")
  }

  return (
    <>
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Steuerberater</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="tax_advisor_name">Name</Label>
              <Input
                id="tax_advisor_name"
                name="tax_advisor_name"
                defaultValue={settings.tax_advisor_name ?? ""}
                placeholder="Dr. Max Mustermann"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tax_advisor_firm">Kanzlei</Label>
              <Input
                id="tax_advisor_firm"
                name="tax_advisor_firm"
                defaultValue={settings.tax_advisor_firm ?? ""}
                placeholder="Steuerberatung Müller GmbH"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tax_advisor_email">E-Mail</Label>
              <Input
                id="tax_advisor_email"
                name="tax_advisor_email"
                type="email"
                defaultValue={settings.tax_advisor_email ?? ""}
                placeholder="steuerberater@kanzlei.de"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tax_advisor_phone">Telefon</Label>
              <Input
                id="tax_advisor_phone"
                name="tax_advisor_phone"
                defaultValue={settings.tax_advisor_phone ?? ""}
                placeholder="+49 30 1234567"
                className="h-11 rounded-xl"
              />
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

    {/* Steuerberater-Zugang */}
    <Card className="rounded-2xl shadow-sm mt-6">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Steuerberater-Zugang</CardTitle>
        <p className="text-sm text-muted-foreground">Geben Sie Ihrem Steuerberater direkten Zugriff auf relevante Daten.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div
            onClick={() => setAccountantMode("accounting")}
            className={cn(
              "rounded-xl border p-4 cursor-pointer transition-colors",
              accountantMode === "accounting"
                ? "border-2 border-primary bg-primary/5"
                : "border-border hover:border-primary"
            )}
          >
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Nur Buchhaltung</span>
              <span className="text-[10px] bg-success/10 text-success rounded-full px-2 py-0.5 font-medium">Empfohlen</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-7">Rechnungen, Bautagesberichte, Mitarbeiter, Stundennachweise</p>
          </div>
          <div
            onClick={() => setAccountantMode("full")}
            className={cn(
              "rounded-xl border p-4 cursor-pointer transition-colors",
              accountantMode === "full"
                ? "border-2 border-primary bg-primary/5"
                : "border-border hover:border-primary"
            )}
          >
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Voller Zugriff</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-7">Alle Module (nur Ansicht)</p>
          </div>
        </div>

        <Button
          className="rounded-xl bg-primary hover:bg-primary/80 font-semibold"
          disabled={savingMode}
          onClick={async () => {
            setSavingMode(true)
            const result = await updateAccountantPermissions("", accountantMode)
            setSavingMode(false)
            if (result.error) toast.error(result.error)
            else toast.success("Zugriffsrechte gespeichert")
          }}
        >
          {savingMode && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Zugriffsrechte speichern
        </Button>

        <p className="text-xs text-muted-foreground/70">
          Der Steuerberater-Zugang wird über das Mitarbeiter-Modul eingerichtet (Rolle: Steuerberater).
        </p>
      </CardContent>
    </Card>
    </>
  )
}
