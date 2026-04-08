import { ModulePageSkeleton } from "@/components/shared/module-page-skeleton"
import { MapPin, CheckCircle2, PauseCircle, Euro } from "lucide-react"

export default function BaustellenLoading() {
  return (
    <ModulePageSkeleton
      title="Baustellen"
      description="Alle Baustellen und deren Status im Überblick."
      actionLabel="Baustelle anlegen"
      stats={[
        { title: "Baustellen gesamt", value: "...", icon: MapPin },
        { title: "Aktiv", value: "...", icon: CheckCircle2 },
        { title: "Pausiert", value: "...", icon: PauseCircle },
        { title: "Budget gesamt", value: "...", icon: Euro },
      ]}
      tableHeaders={["Name", "Adresse", "Status", "Budget", "Bauleiter"]}
    />
  )
}
