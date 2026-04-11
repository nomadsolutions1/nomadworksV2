"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createWorkshopEntry } from "@/lib/actions/fleet"
import { formatCurrency } from "@/lib/utils/format"
import type { Vehicle, Equipment } from "@/lib/actions/fleet"

interface WorkshopEntryFormProps {
  vehicles: Vehicle[]
  equipment: Equipment[]
}

type AssetType = "vehicle" | "equipment"

export function WorkshopEntryForm({ vehicles, equipment }: WorkshopEntryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [assetType, setAssetType] = useState<AssetType>("vehicle")
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [selectedEquipment, setSelectedEquipment] = useState("")

  const [partsCost, setPartsCost] = useState("")
  const [laborCost, setLaborCost] = useState("")
  const [externalCost, setExternalCost] = useState("")
  const totalCost =
    (parseFloat(partsCost.replace(",", ".")) || 0) +
    (parseFloat(laborCost.replace(",", ".")) || 0) +
    (parseFloat(externalCost.replace(",", ".")) || 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)

    if (assetType === "vehicle" && selectedVehicle) {
      formData.set("entity_id", selectedVehicle)
      formData.set("entity_type", "vehicle")
    } else if (assetType === "equipment" && selectedEquipment) {
      formData.set("entity_id", selectedEquipment)
      formData.set("entity_type", "equipment")
    } else {
      toast.error("Bitte wählen Sie ein Fahrzeug oder eine Maschine aus")
      return
    }

    startTransition(async () => {
      const result = await createWorkshopEntry(formData)
      if (result?.error) {
        if (typeof result.error === "string") {
          toast.error(result.error)
        } else {
          setFieldErrors(result.error)
          toast.error("Bitte prüfen Sie Ihre Eingaben")
        }
        return
      }
      if (result?.success) {
        toast.success("Werkstattauftrag angelegt")
        router.push("/fuhrpark/werkstatt")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Asset Selection */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Fahrzeug oder Maschine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={assetType === "vehicle" ? "default" : "outline"}
              size="sm"
              className="rounded-xl font-semibold"
              onClick={() => setAssetType("vehicle")}
            >
              Fahrzeug
            </Button>
            <Button
              type="button"
              variant={assetType === "equipment" ? "default" : "outline"}
              size="sm"
              className="rounded-xl font-semibold"
              onClick={() => setAssetType("equipment")}
            >
              Maschine / Gerät
            </Button>
          </div>

          {assetType === "vehicle" ? (
            <div className="space-y-1.5">
              <Label>Fahrzeug auswählen</Label>
              <Select value={selectedVehicle} onValueChange={(v) => setSelectedVehicle(v ?? "")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Fahrzeug auswählen...">
                    {(value) => {
                      if (!value) return "Fahrzeug auswählen..."
                      const v = vehicles.find((x) => x.id === value)
                      return v ? `${v.make} ${v.model} — ${v.license_plate}` : "Fahrzeug auswählen..."
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {vehicles.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Keine Fahrzeuge vorhanden
                    </SelectItem>
                  ) : (
                    vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} {v.model} — {v.license_plate}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Maschine auswählen</Label>
              <Select
                value={selectedEquipment}
                onValueChange={(v) => setSelectedEquipment(v ?? "")}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Maschine auswählen...">
                    {(value) => {
                      if (!value) return "Maschine auswählen..."
                      const eq = equipment.find((x) => x.id === value)
                      return eq ? `${eq.name} — ${eq.category}` : "Maschine auswählen..."
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {equipment.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Keine Maschinen vorhanden
                    </SelectItem>
                  ) : (
                    equipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} — {eq.category}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          {fieldErrors.entity_id && (
            <p className="text-xs text-danger">{fieldErrors.entity_id[0]}</p>
          )}
        </CardContent>
      </Card>

      {/* Problem */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Problembeschreibung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="reason">Grund *</Label>
              <Input
                id="reason"
                name="reason"
                placeholder="z.B. Ölwechsel, Reifenwechsel, Motorschaden..."
                className="h-11 rounded-xl"
                required
              />
              {fieldErrors.reason && (
                <p className="text-xs text-danger">{fieldErrors.reason[0]}</p>
              )}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Beschreiben Sie das Problem oder den Wartungsauftrag..."
                className="rounded-xl min-h-[100px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="entered_at">Eingangsdatum *</Label>
              <Input
                id="entered_at"
                name="entered_at"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expected_completion">Voraussichtliche Fertigstellung</Label>
              <Input
                id="expected_completion"
                name="expected_completion"
                type="date"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Costs */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Kostenübersicht (optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CostField
              id="cost_parts"
              label="Teilekosten (€)"
              value={partsCost}
              onChange={setPartsCost}
            />
            <CostField
              id="cost_labor"
              label="Arbeitskosten (€)"
              value={laborCost}
              onChange={setLaborCost}
            />
            <CostField
              id="cost_external"
              label="Externe Kosten (€)"
              value={externalCost}
              onChange={setExternalCost}
            />
          </div>

          {totalCost > 0 && (
            <div className="rounded-xl bg-muted/40 border border-border p-4">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-foreground">Gesamtkosten</span>
                <span className="text-primary text-base">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="workshop_name">Werkstatt</Label>
            <Input
              id="workshop_name"
              name="workshop_name"
              placeholder="Name der Werkstatt..."
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Zusätzliche Informationen..."
              className="rounded-xl min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Abbrechen
        </Button>
        <Button type="submit" className="rounded-xl font-semibold" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Werkstattauftrag anlegen
        </Button>
      </div>
    </form>
  )
}

function CostField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="number"
        step="0.01"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="h-11 rounded-xl"
      />
    </div>
  )
}
