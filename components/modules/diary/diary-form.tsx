"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WeatherPicker } from "./weather-picker"
import { createDiaryEntry, updateDiaryEntry } from "@/lib/actions/diary"
import type { DiaryEntry } from "@/lib/actions/diary"
import { Loader2, AlertTriangle, Wrench } from "lucide-react"

interface Site { id: string; name: string }

interface DiaryFormProps {
  mode: "create" | "edit"
  entry?: DiaryEntry
  sites: Site[]
  defaultSiteId?: string
}

export function DiaryForm({ mode, entry, sites, defaultSiteId }: DiaryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [siteId, setSiteId] = useState(entry?.site_id ?? defaultSiteId ?? "")
  const [weather, setWeather] = useState<string | null>(entry?.weather ?? null)

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("site_id", siteId)
    if (weather) formData.set("weather", weather)
    else formData.delete("weather")

    startTransition(async () => {
      if (mode === "create") {
        const result = await createDiaryEntry(formData)
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : "Fehler beim Erstellen"
          toast.error(msg)
          return
        }
        toast.success("Bautagesbericht wurde erstellt")
        router.push(`/bautagesbericht/${result.id}`)
      } else if (entry) {
        const result = await updateDiaryEntry(entry.id, formData)
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : "Fehler beim Speichern"
          toast.error(msg)
          return
        }
        toast.success("Bericht wurde aktualisiert")
        router.push(`/bautagesbericht/${entry.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Grunddaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Baustelle *</Label>
              <Select value={siteId} onValueChange={(v) => setSiteId(v ?? "")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Baustelle wählen" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="entry_date">Datum *</Label>
              <Input id="entry_date" name="entry_date" type="date" defaultValue={entry?.entry_date ?? today} className="h-11 rounded-xl" required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Wetter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Wetterlage</Label>
            <WeatherPicker value={weather} onChange={setWeather} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="temperature">Temperatur (\u00B0C)</Label>
              <Input id="temperature" name="temperature" type="number" step="0.1" defaultValue={entry?.temperature ?? ""} placeholder="z.B. 14" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wind">Windverhaeltnisse</Label>
              <Input id="wind" name="wind" defaultValue={entry?.wind ?? ""} placeholder="z.B. leichter Wind" className="h-11 rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Durchgeführte Arbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="work_description" name="work_description" defaultValue={entry?.work_description ?? ""} placeholder="Beschreiben Sie die heute durchgeführten Arbeiten..." rows={5} className="rounded-xl resize-none" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Vorkommnisse &amp; Probleme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="incidents" className="flex items-center gap-2 text-sm font-semibold">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-destructive/10">
                <AlertTriangle className="h-3 w-3 text-destructive" />
              </span>
              <span className="text-destructive">Vorkommnisse</span>
            </Label>
            <Textarea id="incidents" name="incidents" defaultValue={entry?.incidents ?? ""} placeholder="z.B. Unfall, Zwischenfall, Sicherheitsproblem..." rows={3} className="rounded-xl resize-none border-destructive/20 focus:border-destructive/40" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="defects" className="flex items-center gap-2 text-sm font-semibold">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-warning/10">
                <Wrench className="h-3 w-3 text-warning" />
              </span>
              <span className="text-warning">Mängel</span>
            </Label>
            <Textarea id="defects" name="defects" defaultValue={entry?.defects ?? ""} placeholder="z.B. Materialfehler, Ausführungsmängel..." rows={3} className="rounded-xl resize-none border-warning/20 focus:border-warning/40" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Sonstige Bemerkungen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="notes" name="notes" defaultValue={entry?.notes ?? ""} placeholder="Weitere Anmerkungen zum Tagesbericht..." rows={4} className="rounded-xl resize-none" />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || !siteId} className="rounded-xl font-semibold h-11 px-6">
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {mode === "create" ? "Bericht erstellen" : "Änderungen speichern"}
        </Button>
        <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => router.back()}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
