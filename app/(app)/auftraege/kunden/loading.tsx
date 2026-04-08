import { ModulePageSkeleton } from "@/components/shared/module-page-skeleton"
import { Users, Building2 } from "lucide-react"

export default function KundenLoading() {
  return (
    <ModulePageSkeleton
      title="Kunden"
      description="Verwalten Sie Ihre Kunden und Auftraggeber."
      actionLabel="Kunde anlegen"
      stats={[
        { title: "Kunden gesamt", value: "...", icon: Users },
        { title: "Mit E-Mail", value: "...", icon: Building2 },
        { title: "Mit USt-ID", value: "...", icon: Building2 },
      ]}
      tableHeaders={["Name", "Ansprechpartner", "E-Mail", "Telefon", "Adresse"]}
    />
  )
}
