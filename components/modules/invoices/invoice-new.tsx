"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { InvoiceForm } from "@/components/modules/invoices/invoice-form"
import type { Customer } from "@/lib/actions/customers"

interface InvoiceNewProps {
  customers: Customer[]
  orders: Array<{
    id: string
    title: string
    customer_id: string | null
    items: Array<{
      position: number
      description: string
      unit: string | null
      quantity: number
      unit_price: number
      total: number
    }>
  }>
  defaultTaxRate: number | null
}

export function InvoiceNew({
  customers,
  orders,
  defaultTaxRate,
}: InvoiceNewProps) {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Rechnungen", href: "/rechnungen" },
          { label: "Rechnung erstellen" },
        ]}
      />
      <PageHeader
        title="Rechnung erstellen"
        description="Neue Rechnung anlegen oder aus einem bestehenden Auftrag erzeugen."
      />
      <InvoiceForm
        customers={customers}
        orders={orders}
        defaultTaxRate={defaultTaxRate}
      />
    </div>
  )
}
