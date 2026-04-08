"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { addQualification, deleteQualification } from "@/lib/actions/employees"
import { formatDate } from "@/lib/utils/format"
import { Award, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import type { Qualification } from "@/lib/actions/employees"

const PREDEFINED_QUALIFICATIONS = [
  "Führerschein Klasse B", "Führerschein Klasse C/CE", "Staplerschein",
  "Kranführerschein", "Schweißerschein", "Elektrofachkraft (5kV)",
  "Asbestschutzkurs (TRGS 519)", "Schadstoffkunde", "SiGe-Koordinator (RAB 30)",
  "Baumaschinenführer", "Hebebühnenführerschein", "Erste-Hilfe-Ausbildung",
  "Baggerführerschein", "Gerüstbauerschein", "Sicherheitsunterweisung (DGUV)",
]

interface QualificationListProps {
  userId: string
  qualifications: Qualification[]
}

function getExpiryStatus(expiryDate: string | null): "valid" | "expiring" | "expired" | null {
  if (!expiryDate) return null
  const today = new Date()
  const expiry = new Date(expiryDate)
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  if (expiry < today) return "expired"
  if (expiry <= in30Days) return "expiring"
  return "valid"
}

export function QualificationList({ userId, qualifications: initial }: QualificationListProps) {
  const [qualifications, setQualifications] = useState<Qualification[]>(initial)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [qualName, setQualName] = useState("")
  const [customName, setCustomName] = useState("")
  const isCustom = qualName === "__custom__"
  const handleQualNameChange = (v: string | null) => setQualName(v ?? "")

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("name", isCustom ? customName : qualName)
    startTransition(async () => {
      const result = await addQualification(userId, formData)
      if (result.error) {
        const msg = typeof result.error === "string" ? result.error : Object.values(result.error).flat().join(", ")
        toast.error(msg)
      } else if (result.success && result.data) {
        setQualifications((prev) => [...prev, result.data!])
        setOpen(false)
        setQualName("")
        setCustomName("")
        toast.success("Qualifikation hinzugefügt")
      }
    })
  }

  function handleDelete(qualId: string) {
    startTransition(async () => {
      const result = await deleteQualification(qualId, userId)
      if (result.error) { toast.error(result.error) } else {
        setQualifications((prev) => prev.filter((q) => q.id !== qualId))
        toast.success("Qualifikation entfernt")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {qualifications.length} Qualifikation{qualifications.length !== 1 ? "en" : ""}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" className="rounded-xl font-semibold" />}>
            <Plus className="h-4 w-4 mr-1.5" /> Qualifikation hinzufügen
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Qualifikation hinzufügen</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Bezeichnung *</Label>
                <Select value={qualName} onValueChange={handleQualNameChange}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Qualifikation auswählen" /></SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_QUALIFICATIONS.map((q) => (<SelectItem key={q} value={q}>{q}</SelectItem>))}
                    <SelectItem value="__custom__">Sonstige / Eigene...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isCustom && (
                <div className="space-y-1.5">
                  <Label htmlFor="custom_name">Eigene Bezeichnung *</Label>
                  <Input id="custom_name" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="z.B. Brandschutzbeauftragter" className="h-11 rounded-xl" required={isCustom} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="issued_date">Ausgestellt am</Label><Input id="issued_date" name="issued_date" type="date" className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label htmlFor="expiry_date">Gültig bis</Label><Input id="expiry_date" name="expiry_date" type="date" className="h-11 rounded-xl" /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="issued_by">Ausstellende Stelle</Label><Input id="issued_by" name="issued_by" placeholder="z.B. TÜV Rheinland" className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label htmlFor="notes">Notizen</Label><Textarea id="notes" name="notes" placeholder="Zertifikatsnummer, etc." className="rounded-xl resize-none" rows={2} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Abbrechen</Button>
                <Button type="submit" className="rounded-xl font-semibold" disabled={isPending || !qualName || (isCustom && !customName)}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Speichern
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {qualifications.length === 0 ? (
        <EmptyState icon={Award} title="Noch keine Qualifikationen" description="Fügen Sie Führerscheine, Zertifikate und Weiterbildungen hinzu." />
      ) : (
        <div className="space-y-2">
          {qualifications.map((qual) => {
            const status = getExpiryStatus(qual.expiry_date)
            return (
              <div key={qual.id} className="flex items-start justify-between rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 mt-0.5 ${status === "expired" ? "bg-danger/10" : status === "expiring" ? "bg-warning/10" : "bg-primary/10"}`}>
                    {status === "expired" || status === "expiring" ? (
                      <AlertTriangle className={`h-4 w-4 ${status === "expired" ? "text-danger" : "text-warning"}`} />
                    ) : (
                      <Award className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{qual.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {qual.issued_date && <span className="text-xs text-muted-foreground">Ausgestellt: {formatDate(qual.issued_date)}</span>}
                      {qual.expiry_date && (
                        <span className={`text-xs font-medium ${status === "expired" ? "text-danger" : status === "expiring" ? "text-warning" : "text-muted-foreground"}`}>
                          {status === "expired" ? "Abgelaufen" : "Gültig bis"}: {formatDate(qual.expiry_date)}
                        </span>
                      )}
                    </div>
                    {qual.notes && <p className="text-xs text-muted-foreground mt-1">{qual.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {status === "expired" && <StatusBadge variant="danger" label="Abgelaufen" className="text-[10px]" />}
                  {status === "expiring" && <StatusBadge variant="warning" label="Laeuft ab" className="text-[10px]" />}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg" onClick={() => handleDelete(qual.id)} disabled={isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
