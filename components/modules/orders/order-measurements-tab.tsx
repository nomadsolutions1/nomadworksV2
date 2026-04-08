"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { addMeasurement, deleteMeasurement } from "@/lib/actions/orders"
import type { OrderMeasurement } from "@/lib/actions/orders"
import { formatNumber } from "@/lib/utils/format"
import { Plus, Trash2, Ruler, Loader2 } from "lucide-react"

const UNITS = ["m", "m2", "m3", "cm", "mm", "lfm", "Stk.", "Std."]

interface OrderMeasurementsTabProps {
  orderId: string
  measurements: OrderMeasurement[]
}

export function OrderMeasurementsTab({ orderId, measurements: initial }: OrderMeasurementsTabProps) {
  const [measurements, setMeasurements] = useState(initial)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [unit, setUnit] = useState<string>("m2")
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const l = parseFloat(length) || 0
  const w = parseFloat(width) || 0
  const h = parseFloat(height) || 0
  const previewValue = h > 0 && w > 0 && l > 0 ? l * w * h : l > 0 && w > 0 ? l * w : null

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("unit", unit)
    startTransition(async () => {
      const result = await addMeasurement(orderId, formData)
      if (result.error) { toast.error("Fehler beim Hinzufuegen"); return }
      if (result.data) setMeasurements((prev) => [result.data!, ...prev])
      toast.success("Aufmass wurde hinzugefuegt")
      setIsAddOpen(false)
      setLength(""); setWidth(""); setHeight("")
    })
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteMeasurement(id, orderId)
      if (result.error) { toast.error("Fehler beim Loeschen"); return }
      setMeasurements((prev) => prev.filter((m) => m.id !== id))
      toast.success("Aufmass wurde geloescht")
      setDeleteId(null)
    })
  }

  const totalCalculated = measurements.reduce((sum, m) => sum + (m.calculated_value ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-muted-foreground">
          {totalCalculated > 0 && <span>Gesamt: <span className="font-semibold text-foreground">{formatNumber(totalCalculated)}</span></span>}
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-xl font-semibold h-9 gap-2 text-sm"><Plus className="h-3.5 w-3.5" /> Aufmass hinzufuegen</Button>
      </div>

      {measurements.length === 0 ? (
        <EmptyState icon={Ruler} title="Kein Aufmass vorhanden" description="Fuegen Sie Masse hinzu — Flaechen und Volumen werden automatisch berechnet." action={{ label: "Aufmass hinzufuegen", onClick: () => setIsAddOpen(true) }} />
      ) : (
        <Card className="rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Beschreibung</TableHead><TableHead className="w-20 text-right">L (m)</TableHead><TableHead className="w-20 text-right">B (m)</TableHead><TableHead className="w-20 text-right">H (m)</TableHead><TableHead className="w-20 text-right">Menge</TableHead><TableHead className="w-24 text-right">Ergebnis</TableHead><TableHead className="w-16">Einheit</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>
                {measurements.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/50 even:bg-muted/30">
                    <TableCell className="text-sm">{m.description}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{m.length !== null ? formatNumber(m.length) : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{m.width !== null ? formatNumber(m.width) : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{m.height !== null ? formatNumber(m.height) : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatNumber(m.quantity)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{m.calculated_value !== null ? <span className="font-semibold">{formatNumber(m.calculated_value ?? 0)}</span> : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.unit}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10" onClick={() => setDeleteId(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>Aufmass hinzufuegen</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="description">Beschreibung *</Label><Input id="description" name="description" placeholder="z.B. Wand Nord" className="h-11 rounded-xl" required /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Laenge (m)</Label><Input name="length" type="number" step="0.01" min="0" className="h-11 rounded-xl" value={length} onChange={(e) => setLength(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Breite (m)</Label><Input name="width" type="number" step="0.01" min="0" className="h-11 rounded-xl" value={width} onChange={(e) => setWidth(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Hoehe (m)</Label><Input name="height" type="number" step="0.01" min="0" className="h-11 rounded-xl" value={height} onChange={(e) => setHeight(e.target.value)} /></div>
            </div>
            {previewValue !== null && <div className="rounded-xl bg-muted p-3 text-sm"><p className="text-muted-foreground">Ergebnis: <span className="font-semibold text-foreground">{formatNumber(previewValue)} {unit}</span></p></div>}
            <div className="space-y-1.5"><Label>Einheit *</Label><Select value={unit} onValueChange={(v) => setUnit(v ?? "m2")}><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{UNITS.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}</SelectContent></Select></div>
            <DialogFooter><Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddOpen(false)}>Abbrechen</Button><Button type="submit" disabled={isPending} className="rounded-xl font-semibold">{isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Hinzufuegen</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent className="rounded-2xl"><AlertDialogHeader><AlertDialogTitle>Aufmass loeschen?</AlertDialogTitle><AlertDialogDescription>Dieser Eintrag wird unwiderruflich geloescht.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} variant="destructive" className="rounded-xl font-semibold">Loeschen</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
