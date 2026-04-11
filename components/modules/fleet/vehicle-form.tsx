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
import { createVehicle, updateVehicle } from "@/lib/actions/fleet"
import type { Vehicle } from "@/lib/actions/fleet"
import {
  NumericField,
  PurchaseFields,
  FinancingFields,
  LeasingFields,
  RentalFields,
} from "@/components/modules/fleet/vehicle-form-fields"

interface VehicleFormProps {
  vehicle?: Vehicle
  mode: "create" | "edit"
}

// DB CHECK constraint: type IN ('truck','car','van')
const VEHICLE_TYPES = [
  { value: "truck", label: "LKW" },
  { value: "car", label: "PKW" },
  { value: "van", label: "Transporter" },
]

const ACQUISITION_TYPES = [
  { value: "purchase", label: "Kauf" },
  { value: "financing", label: "Finanzierung" },
  { value: "leasing", label: "Leasing" },
  { value: "rental", label: "Miete" },
]

const AVAILABILITY_STATUSES = [
  { value: "available", label: "Frei" },
  { value: "in_use", label: "Im Einsatz" },
  { value: "workshop", label: "Werkstatt" },
  { value: "reserved", label: "Reserviert" },
]

export function VehicleForm({ vehicle, mode }: VehicleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [vehicleType, setVehicleType] = useState(vehicle?.type ?? "")
  const [acquisitionType, setAcquisitionType] = useState(vehicle?.acquisition_type ?? "")
  const [availabilityStatus, setAvailabilityStatus] = useState(
    vehicle?.availability_status ?? "available"
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    formData.set("type", vehicleType)
    formData.set("acquisition_type", acquisitionType)
    formData.set("availability_status", availabilityStatus)
    formData.set("status", availabilityStatus)

    startTransition(async () => {
      const action =
        mode === "create" ? createVehicle : (fd: FormData) => updateVehicle(vehicle!.id, fd)
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
          mode === "create" ? "Fahrzeug erfolgreich angelegt" : "Fahrzeug erfolgreich aktualisiert"
        )
        if (mode === "create") router.push("/fuhrpark/fahrzeuge")
        else router.refresh()
      }
    })
  }

  const showPurchase = !acquisitionType || acquisitionType === "purchase"
  const showFinancing = acquisitionType === "financing"
  const showLeasing = acquisitionType === "leasing"
  const showRental = acquisitionType === "rental"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fahrzeugdaten */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Fahrzeugdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="license_plate">Kennzeichen *</Label>
              <Input
                id="license_plate"
                name="license_plate"
                defaultValue={vehicle?.license_plate ?? ""}
                placeholder="B-NW 1234"
                className="h-11 rounded-xl font-mono"
                required
              />
              {fieldErrors.license_plate && (
                <p className="text-xs text-danger">{fieldErrors.license_plate[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="make">Hersteller *</Label>
              <Input
                id="make"
                name="make"
                defaultValue={vehicle?.make ?? ""}
                placeholder="MAN"
                className="h-11 rounded-xl"
                required
              />
              {fieldErrors.make && <p className="text-xs text-danger">{fieldErrors.make[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Modell *</Label>
              <Input
                id="model"
                name="model"
                defaultValue={vehicle?.model ?? ""}
                placeholder="TGS 41.460"
                className="h-11 rounded-xl"
                required
              />
              {fieldErrors.model && <p className="text-xs text-danger">{fieldErrors.model[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Fahrzeugtyp *</Label>
              <Select value={vehicleType} onValueChange={(v) => setVehicleType(v ?? "")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Typ auswählen">
                    {(value) =>
                      VEHICLE_TYPES.find((t) => t.value === value)?.label ?? "Typ auswählen"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.type && <p className="text-xs text-danger">{fieldErrors.type[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">Baujahr</Label>
              <Input
                id="year"
                name="year"
                type="number"
                min={1970}
                max={2030}
                defaultValue={vehicle?.year ?? ""}
                placeholder="2022"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mileage">Kilometerstand</Label>
              <Input
                id="mileage"
                name="mileage"
                type="number"
                min={0}
                defaultValue={vehicle?.mileage ?? ""}
                placeholder="125000"
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
              <Label htmlFor="next_inspection">Nächster TÜV</Label>
              <Input
                id="next_inspection"
                name="next_inspection"
                type="date"
                defaultValue={vehicle?.next_inspection ?? ""}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Laufende Kosten */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Laufende Kosten (monatlich)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <NumericField
              id="insurance_cost"
              label="Versicherung (€/Monat)"
              defaultValue={vehicle?.insurance_cost}
              placeholder="150.00"
            />
            <NumericField
              id="tax_cost"
              label="KFZ-Steuer (€/Monat)"
              defaultValue={vehicle?.tax_cost}
              placeholder="85.00"
            />
            <NumericField
              id="leasing_cost"
              label="Leasing/Rate (€/Monat)"
              defaultValue={vehicle?.leasing_cost}
              placeholder="800.00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Beschaffung & Finanzierung */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Beschaffung &amp; Finanzierung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Beschaffungsart</Label>
            <Select value={acquisitionType} onValueChange={(v) => setAcquisitionType(v ?? "")}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Beschaffungsart auswählen">
                  {(value) =>
                    ACQUISITION_TYPES.find((t) => t.value === value)?.label ??
                    "Beschaffungsart auswählen"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ACQUISITION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showPurchase && <PurchaseFields vehicle={vehicle} />}
          {showFinancing && <FinancingFields vehicle={vehicle} />}
          {showLeasing && <LeasingFields vehicle={vehicle} />}
          {showRental && <RentalFields vehicle={vehicle} />}
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
          {mode === "create" ? "Fahrzeug anlegen" : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  )
}
