import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { EquipmentForm } from "@/components/modules/fleet/equipment-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Maschine hinzufügen" }

export default function NeueMaschinePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Fuhrpark", href: "/fuhrpark" },
          { label: "Maschinen", href: "/fuhrpark/maschinen" },
          { label: "Neu anlegen" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold font-heading text-foreground">
          Maschine hinzufügen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Legen Sie eine neue Maschine oder ein neues Gerät an.
        </p>
      </div>
      <EquipmentForm mode="create" />
    </div>
  )
}
