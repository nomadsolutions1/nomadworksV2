"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { OrderForm } from "@/components/modules/orders/order-form"
import type { Customer } from "@/lib/actions/customers"

interface OrderNewProps {
  customers: Customer[]
}

export function OrderNew({ customers }: OrderNewProps) {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Auftraege", href: "/auftraege" }, { label: "Neuer Auftrag" }]} />
      <PageHeader title="Auftrag anlegen" description="Erstellen Sie einen neuen Auftrag fuer Ihr Unternehmen." />
      <OrderForm mode="create" customers={customers} />
    </div>
  )
}
