import { ModulePageSkeleton } from "@/components/shared/module-page-skeleton"
import { Receipt, FilePen, FileCheck2, Clock, AlertTriangle } from "lucide-react"

export default function RechnungenLoading() {
  return (
    <ModulePageSkeleton
      title="Rechnungen"
      description="Verwalten Sie Ihre Rechnungen und das Mahnwesen."
      actionLabel="Leistungsrechnung"
      stats={[
        { title: "Gesamt", value: "...", icon: Receipt },
        { title: "Entwurf", value: "...", icon: FilePen },
        { title: "Bezahlt", value: "...", icon: FileCheck2 },
        { title: "Offen", value: "...", icon: Clock },
        { title: "Ueberfaellig", value: "...", icon: AlertTriangle },
      ]}
      tableHeaders={["Nr.", "Kunde", "Betrag", "Status", "Datum", "Faellig am"]}
    />
  )
}
