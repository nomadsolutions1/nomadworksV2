import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { SubcontractorForm } from "@/components/modules/subcontractors/subcontractor-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Subunternehmer anlegen" }

export default function NeuerSubunternehmerPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Subunternehmer", href: "/subunternehmer" },
          { label: "Neu anlegen" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold font-heading text-foreground">
          Subunternehmer anlegen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Erfassen Sie Stammdaten, §48b-Bescheinigung und Bewertung.
        </p>
      </div>
      <SubcontractorForm mode="create" />
    </div>
  )
}
