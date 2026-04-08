import { PageHeader } from "@/components/layout/page-header"
import { CompanyCreateForm } from "@/components/modules/admin/company-create-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Firma anlegen" }

export default function NeueFirePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Firma anlegen"
        description="Neue Firma im System registrieren (White-Glove Onboarding)."
      />
      <CompanyCreateForm />
    </div>
  )
}
