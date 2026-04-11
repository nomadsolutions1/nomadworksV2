import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { VehicleForm } from "@/components/modules/fleet/vehicle-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Fahrzeug hinzufügen" }

export default function NeuesFahrzeugPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Fuhrpark", href: "/fuhrpark" },
          { label: "Fahrzeuge", href: "/fuhrpark/fahrzeuge" },
          { label: "Neu anlegen" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold font-heading text-foreground">
          Fahrzeug hinzufügen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Legen Sie ein neues Fahrzeug mit Finanzierungsdaten an.
        </p>
      </div>
      <VehicleForm mode="create" />
    </div>
  )
}
