import { getSites } from "@/lib/actions/sites"
import { getCustomers } from "@/lib/actions/customers"
import { RegieInvoiceForm } from "@/components/modules/invoices/regie-invoice-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Regierechnung" }

export default async function RegieRechnungPage() {
  const [{ data: sites }, { data: customers }] = await Promise.all([
    getSites(),
    getCustomers(),
  ])

  const siteList = (sites ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
  }))
  const customerList = (customers ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return <RegieInvoiceForm sites={siteList} customers={customerList} />
}
