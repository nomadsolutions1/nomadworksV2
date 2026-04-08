"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { getSiteMeasurements } from "@/lib/actions/sites"
// TODO: Request from Elena (Agent 3) — addSiteMeasurement, deleteSiteMeasurement actions
async function addSiteMeasurement(_siteId: string, _fd: FormData): Promise<{ error?: string }> {
  return { error: "Aktion noch nicht implementiert — bitte Elena kontaktieren." }
}
async function deleteSiteMeasurement(_id: string, _siteId: string): Promise<{ error?: string }> {
  return { error: "Aktion noch nicht implementiert — bitte Elena kontaktieren." }
}
import type { SiteMeasurement } from "@/lib/actions/sites"
import { toast } from "sonner"

interface SiteMeasurementsProps { siteId: string }

export function SiteMeasurements({ siteId }: SiteMeasurementsProps) {
  const [measurements, setMeasurements] = useState<SiteMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

  function load() { getSiteMeasurements(siteId).then(({ data }) => { setMeasurements(data ?? []); setLoading(false) }) }
  useEffect(() => { load() }, [siteId])

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await addSiteMeasurement(siteId, fd)
      if (result.error) { toast.error(typeof result.error === "string" ? result.error : "Fehler"); return }
      toast.success("Aufmass hinzugefuegt"); setShowDialog(false); load()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteSiteMeasurement(id, siteId)
      if (result.error) { toast.error(result.error); return }
      toast.success("Aufmass geloescht"); load()
    })
  }

  if (loading) return <Skeleton className="h-48 rounded-2xl" />

  return (
    <>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Aufmass ({measurements.length})</CardTitle>
          <Button size="sm" className="rounded-lg text-xs h-8" onClick={() => setShowDialog(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Hinzufuegen</Button>
        </CardHeader>
        <CardContent>
          {measurements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Noch keine Aufmasse erfasst.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="pb-2 font-medium">Beschreibung</th><th className="pb-2 font-medium text-right">L x B x H</th><th className="pb-2 font-medium text-right">Einheit</th><th className="pb-2 font-medium text-right">Menge</th><th className="pb-2 font-medium text-right">Wert</th><th className="pb-2 w-10"></th></tr></thead>
                <tbody className="divide-y divide-border">
                  {measurements.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 font-medium">{m.description}</td>
                      <td className="py-2 text-right font-mono text-xs text-muted-foreground">{[m.length, m.width, m.height].filter(Boolean).join(" x ") || "—"}</td>
                      <td className="py-2 text-right">{m.unit}</td>
                      <td className="py-2 text-right font-mono">{m.quantity}</td>
                      <td className="py-2 text-right font-mono font-medium">{m.calculated_value?.toFixed(2) ?? "—"}</td>
                      <td className="py-2"><button onClick={() => handleDelete(m.id)} className="text-muted-foreground hover:text-danger" disabled={isPending}><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>Aufmass hinzufuegen</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5"><Label>Beschreibung *</Label><Input name="description" placeholder="z.B. Bodenplatte Block A" className="h-11 rounded-xl" required /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Laenge</Label><Input name="length" type="number" step="0.01" placeholder="m" className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Breite</Label><Input name="width" type="number" step="0.01" placeholder="m" className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Hoehe</Label><Input name="height" type="number" step="0.01" placeholder="m" className="h-11 rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Einheit *</Label><Input name="unit" defaultValue="m2" className="h-11 rounded-xl" required /></div>
              <div className="space-y-1.5"><Label>Menge</Label><Input name="quantity" type="number" step="0.01" defaultValue="1" className="h-11 rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label>Notizen</Label><Input name="notes" placeholder="Optional" className="h-11 rounded-xl" /></div>
            <Button type="submit" disabled={isPending} className="w-full rounded-xl font-semibold h-11">{isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Hinzufuegen</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
