"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateSOKASettings } from "@/lib/actions/settings"
import { Loader2, Save } from "lucide-react"
import type { CompanySettings } from "@/lib/actions/settings"

interface SokaFormProps {
  settings: CompanySettings
}

export function SokaForm({ settings }: SokaFormProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateSOKASettings(formData)
    setLoading(false)

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Fehler beim Speichern")
      return
    }

    toast.success("SOKA-Bau Daten gespeichert")
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">SOKA-Bau Einstellungen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 mb-4">
            <p className="text-sm text-accent-foreground">
              Diese Daten werden für den automatischen SOKA-Bau Export verwendet. Bitte stellen Sie sicher, dass die Angaben korrekt sind.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="soka_betriebskonto_nr">Betriebskonto-Nummer</Label>
              <Input
                id="soka_betriebskonto_nr"
                name="soka_betriebskonto_nr"
                defaultValue={settings.soka_betriebskonto_nr ?? ""}
                placeholder="123456789"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="soka_branchenkennziffer">Branchenkennziffer</Label>
              <Input
                id="soka_branchenkennziffer"
                name="soka_branchenkennziffer"
                defaultValue={settings.soka_branchenkennziffer ?? ""}
                placeholder="01"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-foreground mb-3">Umlagesätze</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="soka_umlagesatz_urlaub">Urlaub (%)</Label>
                <Input
                  id="soka_umlagesatz_urlaub"
                  name="soka_umlagesatz_urlaub"
                  type="number"
                  step="0.01"
                  defaultValue={settings.soka_umlagesatz_urlaub ?? ""}
                  placeholder="14.25"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="soka_umlagesatz_berufsbildung">Berufsbildung (%)</Label>
                <Input
                  id="soka_umlagesatz_berufsbildung"
                  name="soka_umlagesatz_berufsbildung"
                  type="number"
                  step="0.01"
                  defaultValue={settings.soka_umlagesatz_berufsbildung ?? ""}
                  placeholder="2.10"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="soka_umlagesatz_rente">Rente (%)</Label>
                <Input
                  id="soka_umlagesatz_rente"
                  name="soka_umlagesatz_rente"
                  type="number"
                  step="0.01"
                  defaultValue={settings.soka_umlagesatz_rente ?? ""}
                  placeholder="0.80"
                  className="h-11 rounded-xl"
                />
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
