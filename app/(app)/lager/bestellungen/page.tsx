import { listPurchaseOrders } from "@/lib/actions/inventory"
import { PurchaseOrderList } from "@/components/modules/inventory/purchase-order-list"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Bestellungen" }

export default async function BestellungenPage() {
  const { data: orders = [] } = await listPurchaseOrders()
  return <PurchaseOrderList orders={orders} />
}
