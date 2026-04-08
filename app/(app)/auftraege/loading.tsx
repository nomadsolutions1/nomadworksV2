import { ModulePageSkeleton } from "@/components/shared/module-page-skeleton"
import { FileText, Clock, CheckCircle2, Euro } from "lucide-react"

export default function AuftraegeLoading() {
  return (
    <ModulePageSkeleton
      title="Aufträge"
      description="Verwalten Sie Ihre Aufträge von Angebot bis Abschluss."
      actionLabel="Auftrag anlegen"
      stats={[
        { title: "Aufträge gesamt", value: "...", icon: FileText },
        { title: "In Arbeit", value: "...", icon: Clock },
        { title: "Abgeschlossen", value: "...", icon: CheckCircle2 },
        { title: "Auftragswert gesamt", value: "...", icon: Euro },
      ]}
      tableHeaders={["Auftrag", "Kunde", "Baustellen", "Status", "Budget", "Start"]}
    />
  )
}
