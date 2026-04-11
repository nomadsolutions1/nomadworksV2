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
import { Plus, Trash2, Fuel, Loader2 } from "lucide-react"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { createFuelLog, deleteFuelLog } from "@/lib/actions/fleet"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils/format"
import type { FuelEntry } from "@/lib/actions/fleet"

interface FuelLogDialogProps {
  vehicleId: string
  entries: FuelEntry[]
}

export function FuelLogDialog({ vehicleId, entries }: FuelLogDialogProps) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const totalLiters = entries.reduce((sum, e) => sum + e.liters, 0)
  const totalCost = entries.reduce((sum, e) => sum + e.cost, 0)
  const avgCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const result = await createFuelLog(vehicleId, formData)
      if (result?.error) {
        const msg =
          typeof result.error === "string"
            ? result.error
            : Object.values(result.error).flat().join(", ")
        toast.error(msg)
      } else if (result?.success) {
        toast.success("Tankeintrag hinzugefügt")
        setShowForm(false)
        form.reset()
      }
    })
  }

  function handleDelete(entryId: string) {
    startTransition(async () => {
      const result = await deleteFuelLog(entryId, vehicleId)
      if (result?.error) toast.error(result.error)
      else toast.success("Tankeintrag gelöscht")
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCell label="Gesamt Liter" value={`${formatNumber(totalLiters)} L`} />
        <SummaryCell label="Gesamtkosten" value={formatCurrency(totalCost)} />
        <SummaryCell label="Ø Preis/Liter" value={formatCurrency(avgCostPerLiter)} />
      </div>

      {showForm ? (
        <Card className="rounded-2xl shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">
              Tankeintrag hinzufügen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fuel_date">Datum *</Label>
                  <Input
                    id="fuel_date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="h-10 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fuel_liters">Liter *</Label>
                  <Input
                    id="fuel_liters"
                    name="liters"
                    type="number"
                    step="0.01"
                    min={0.01}
                    placeholder="65.00"
                    className="h-10 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fuel_cost">Kosten (€) *</Label>
                  <Input
                    id="fuel_cost"
                    name="cost"
                    type="number"
                    step="0.01"
                    min={0.01}
                    placeholder="108.25"
                    className="h-10 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fuel_mileage">km-Stand</Label>
                  <Input
                    id="fuel_mileage"
                    name="mileage"
                    type="number"
                    min={0}
                    placeholder="125000"
                    className="h-10 rounded-xl font-mono"
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
          Tankeintrag hinzufügen
        </Button>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-2xl bg-muted p-4 mb-3">
            <Fuel className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Noch keine Tankeinträge</p>
          <p className="text-xs text-muted-foreground mt-1">Fügen Sie den ersten Tankeintrag hinzu.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Datum</TableHead>
                <TableHead>Liter</TableHead>
                <TableHead>Kosten</TableHead>
                <TableHead>Preis/L</TableHead>
                <TableHead>km-Stand</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                  <TableCell className="text-sm font-mono">
                    {formatNumber(entry.liters)} L
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    {formatCurrency(entry.cost)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatCurrency(entry.liters > 0 ? entry.cost / entry.liters : 0)}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">
                    {entry.mileage ? `${formatNumber(entry.mileage)} km` : "—"}
                  </TableCell>
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
                      title="Tankeintrag löschen?"
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

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 border border-border p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
