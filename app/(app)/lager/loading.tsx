import { ModulePageSkeleton } from "@/components/shared/module-page-skeleton"
import { Package, AlertTriangle, ShoppingCart, Boxes } from "lucide-react"

export default function LagerLoading() {
  return (
    <ModulePageSkeleton
      title="Lager & Einkauf"
      description="Materialbestand, Bestellungen und Lieferanten verwalten."
      actionLabel="Material hinzufügen"
      stats={[
        { title: "Materialien", value: "—", icon: Package },
        { title: "Unter Mindestbestand", value: "—", icon: AlertTriangle },
        { title: "Offene Bestellungen", value: "—", icon: ShoppingCart },
        { title: "Lagerwert (geschätzt)", value: "—", icon: Boxes },
      ]}
      tableHeaders={["Material", "Kategorie", "Bestand", "Mindestbestand", "Preis", "Lieferant"]}
    />
  )
}
