"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createEquipment, updateEquipment } from "@/lib/actions/fleet"
import { EQUIPMENT_TYPES } from "@/lib/utils/constants"
import type { Equipment } from "@/lib/actions/fleet"

interface EquipmentFormProps {
  equipment?: Equipment
  mode: "create" | "edit"
}

const AVAILABILITY_STATUSES = [
  { value: "available", label: "Frei" },
  { value: "in_use", label: "Im Einsatz" },
  { value: "workshop", label: "Werkstatt" },
  { value: "reserved", label: "Reserviert" },
]

export function EquipmentForm({ equipment, mode }: EquipmentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [equipmentType, setEquipmentType] = useState(equipment?.category ?? "")
  const [availabilityStatus, setAvailabilityStatus] = useState(
    equipment?.availability_status ?? "available"
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    formData.set("category", equipmentType)
    formData.set("availability_status", availabilityStatus)
    formData.set("status", availabilityStatus)

    startTransition(async () => {
      const action =
        mode === "create" ? createEquipment : (fd: FormData) => updateEquipment(equipment!.id, fd)
      const result = await action(formData)

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
        toast.success(
          mode === "create" ? "Maschine erfolgreich angelegt" : "Maschine erfolgreich aktualisiert"
        )
        if (mode === "create") router.push("/fuhrpark/maschinen")
        else router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Maschinendaten */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Maschinendaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Bezeichnung *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={equipment?.name ?? ""}
                placeholder="CAT 320 Hydraulikbagger"
                className="h-11 rounded-xl"
                required
              />
              {fieldErrors.name && <p className="text-xs text-danger">{fieldErrors.name[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Typ *</Label>
              <Select value={equipmentType} onValueChange={(v) => setEquipmentType(v ?? "")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Typ auswählen">
                    {(value) => (value as string) || "Typ auswählen"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.category && (
                <p className="text-xs text-danger">{fieldErrors.category[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="serial_number">Seriennummer</Label>
              <Input
                id="serial_number"
                name="serial_number"
                defaultValue={equipment?.serial_number ?? ""}
                placeholder="CAT-320-2022-001"
                className="h-11 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Verfügbarkeitsstatus</Label>
              <Select
                value={availabilityStatus}
                onValueChange={(v) => setAvailabilityStatus(v ?? "available")}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Status auswählen">
                    {(value) =>
                      AVAILABILITY_STATUSES.find((s) => s.value === value)?.label ??
                      "Status auswählen"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next_maintenance">Nächste Wartung</Label>
              <Input
                id="next_maintenance"
                name="next_maintenance"
                type="date"
                defaultValue={equipment?.next_maintenance ?? ""}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anschaffung & Kosten */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Anschaffung &amp; Kosten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="purchase_price">Anschaffungspreis (€)</Label>
              <Input
                id="purchase_price"
                name="purchase_price"
                type="number"
                step="0.01"
                min={0}
                defaultValue={equipment?.purchase_price ?? ""}
                placeholder="45000.00"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchase_date">Kaufdatum</Label>
              <Input
                id="purchase_date"
                name="purchase_date"
                type="date"
                defaultValue={equipment?.purchase_date ?? ""}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="daily_rate">Interner Tagessatz (€)</Label>
              <Input
                id="daily_rate"
                name="daily_rate"
                type="number"
                step="0.01"
                min={0}
                defaultValue={equipment?.daily_rate ?? ""}
                placeholder="120.00"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
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
          {mode === "create" ? "Maschine anlegen" : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  )
}
