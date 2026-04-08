"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { CustomerForm } from "@/components/modules/orders/customer-form"

export function CustomerNew() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Auftraege", href: "/auftraege" }, { label: "Kunden", href: "/auftraege/kunden" }, { label: "Neuer Kunde" }]} />
      <PageHeader title="Kunde anlegen" description="Erstellen Sie einen neuen Kunden fuer Ihr Unternehmen." />
      <CustomerForm mode="create" />
    </div>
  )
}
