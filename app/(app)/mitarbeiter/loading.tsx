import { ModulePageSkeleton } from "@/components/shared/module-page-skeleton"
import { Users, UserCheck, UserX, Clock } from "lucide-react"

export default function MitarbeiterLoading() {
  return (
    <ModulePageSkeleton
      title="Mitarbeiter"
      description="Verwalten Sie Ihr Team und deren Qualifikationen."
      actionLabel="Mitarbeiter hinzufügen"
      stats={[
        { title: "Gesamt", value: "...", icon: Users },
        { title: "Aktiv", value: "...", icon: UserCheck },
        { title: "Abwesend", value: "...", icon: UserX },
        { title: "Stunden (Woche)", value: "...", icon: Clock },
      ]}
      tableHeaders={["Name", "Rolle", "Telefon", "Status", "Vertrag", "Account"]}
    />
  )
}
