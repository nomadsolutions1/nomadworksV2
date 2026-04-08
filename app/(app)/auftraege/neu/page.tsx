import { getCustomers } from "@/lib/actions/customers"
import { OrderNew } from "@/components/modules/orders/order-new"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Auftrag anlegen" }

export default async function NeuerAuftragPage() {
  const { data: customers = [] } = await getCustomers()
  return <OrderNew customers={customers} />
}
