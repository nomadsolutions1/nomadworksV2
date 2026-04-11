import { listVehicles, listEquipment } from "@/lib/actions/fleet"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { WorkshopEntryForm } from "@/components/modules/fleet/workshop-entry-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Werkstattauftrag anlegen" }

export default async function NeueWerkstattPage() {
  const [vehiclesRes, equipmentRes] = await Promise.all([listVehicles(), listEquipment()])

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "Fuhrpark", href: "/fuhrpark" },
          { label: "Werkstatt", href: "/fuhrpark/werkstatt" },
          { label: "Neu anlegen" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold font-heading text-foreground">
          Werkstattauftrag anlegen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Erfassen Sie einen Werkstattauftrag für ein Fahrzeug oder eine Maschine.
        </p>
      </div>
      <WorkshopEntryForm
        vehicles={vehiclesRes.data ?? []}
        equipment={equipmentRes.data ?? []}
      />
    </div>
  )
}
