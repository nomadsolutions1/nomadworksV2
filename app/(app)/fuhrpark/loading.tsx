import { ModulePageSkeleton } from "@/components/shared/module-page-skeleton"
import { Truck, Cog, Wrench, AlertTriangle } from "lucide-react"

export default function FuhrparkLoading() {
  return (
    <ModulePageSkeleton
      title="Fuhrpark"
      description="Fahrzeuge, Maschinen und Werkstatt auf einen Blick."
      actionLabel="Werkstattauftrag"
      stats={[
        { title: "Fahrzeuge", value: "—", icon: Truck },
        { title: "Maschinen", value: "—", icon: Cog },
        { title: "Werkstatt aktiv", value: "—", icon: Wrench },
        { title: "Warnungen", value: "—", icon: AlertTriangle },
      ]}
      tableHeaders={["Kennzeichen", "Fahrzeug", "Typ", "Status", "TÜV", "km-Stand"]}
    />
  )
}
