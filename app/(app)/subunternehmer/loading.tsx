import { ModulePageSkeleton } from "@/components/shared/module-page-skeleton"
import { Handshake, CheckCircle2, AlertTriangle, Star } from "lucide-react"

export default function SubunternehmerLoading() {
  return (
    <ModulePageSkeleton
      title="Subunternehmer"
      description="Verwalten Sie Ihre Subunternehmer, §48b-Bescheinigungen und Einsätze."
      actionLabel="Subunternehmer hinzufügen"
      stats={[
        { title: "Gesamt", value: "—", icon: Handshake },
        { title: "§48b gültig", value: "—", icon: CheckCircle2 },
        { title: "§48b Warnung", value: "—", icon: AlertTriangle },
        { title: "Ø Bewertung", value: "—", icon: Star },
      ]}
      tableHeaders={["Firma", "Gewerk", "§48b", "Bewertung", "Aktive Einsätze"]}
    />
  )
}
