import { getCustomers } from "@/lib/actions/customers"
import { CustomerList } from "@/components/modules/orders/customer-list"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Kunden" }

export default async function KundenPage() {
  const { data: customers = [] } = await getCustomers()
  const tableData = customers.map((c) => ({ ...c } as Record<string, unknown>))
  return <CustomerList customers={tableData} />
}
