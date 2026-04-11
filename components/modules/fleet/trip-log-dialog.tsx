"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2, Navigation, Loader2 } from "lucide-react"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { createTripLog, deleteTripLog } from "@/lib/actions/fleet"
import { formatDate, formatNumber } from "@/lib/utils/format"
import type { TripEntry } from "@/lib/actions/fleet"

interface TripLogDialogProps {
  vehicleId: string
  entries: TripEntry[]
}

export function TripLogDialog({ vehicleId, entries }: TripLogDialogProps) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const totalKm = entries.reduce((sum, e) => sum + e.km, 0)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const result = await createTripLog(vehicleId, formData)
      if (result?.error) {
        const msg =
          typeof result.error === "string"
            ? result.error
            : Object.values(result.error).flat().join(", ")
        toast.error(msg)
      } else if (result?.success) {
        toast.success("Fahrt hinzugefügt")
        setShowForm(false)
        form.reset()
      }
    })
  }

  function handleDelete(entryId: string) {
    startTransition(async () => {
      const result = await deleteTripLog(entryId, vehicleId)
      if (result?.error) toast.error(result.error)
      else toast.success("Fahrt gelöscht")
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-muted/40 border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Gesamtkilometer</p>
          <p className="text-xl font-semibold text-foreground">{formatNumber(totalKm)} km</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Fahrten gesamt</p>
          <p className="text-xl font-semibold text-foreground">{entries.length}</p>
        </div>
      </div>

      {showForm ? (
        <Card className="rounded-2xl shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Fahrt hinzufügen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="space-y-1.5">
                  <Label htmlFor="trip_date">Datum *</Label>
                  <Input
                    id="trip_date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="h-10 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trip_start">Startort *</Label>
                  <Input
                    id="trip_start"
                    name="start_location"
                    placeholder="Betriebshof"
                    className="h-10 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trip_end">Zielort *</Label>
                  <Input
                    id="trip_end"
                    name="end_location"
                    placeholder="Baustelle Hauptstraße"
                    className="h-10 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trip_km">Kilometer *</Label>
                  <Input
                    id="trip_km"
                    name="km"
                    type="number"
                    min={1}
                    placeholder="42"
                    className="h-10 rounded-xl font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trip_purpose">Zweck *</Label>
                  <Input
                    id="trip_purpose"
                    name="purpose"
                    placeholder="Materiallieferung"
                    className="h-10 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setShowForm(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl font-semibold"
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                  Hinzufügen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="rounded-xl border-dashed"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Fahrt hinzufügen
        </Button>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-2xl bg-muted p-4 mb-3">
            <Navigation className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Noch keine Fahrten</p>
          <p className="text-xs text-muted-foreground mt-1">Fügen Sie die erste Fahrt hinzu.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Datum</TableHead>
                <TableHead>Startort</TableHead>
                <TableHead>Zielort</TableHead>
                <TableHead>Kilometer</TableHead>
                <TableHead>Zweck</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.start_location}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.end_location}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-primary">
                    {formatNumber(entry.km)} km
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{entry.purpose}</TableCell>
                  <TableCell>
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-danger hover:text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                      title="Fahrteintrag löschen?"
                      description="Dieser Eintrag wird unwiderruflich gelöscht."
                      confirmLabel="Löschen"
                      onConfirm={() => handleDelete(entry.id)}
                      destructive
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
