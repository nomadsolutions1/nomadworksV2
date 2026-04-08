import { getOrders } from "@/lib/actions/orders"
import { OrderList } from "@/components/modules/orders/order-list"
import { TipsBanner } from "@/components/shared/tips-banner"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Auftraege" }

export default async function AuftraegePage() {
  const { data: orders = [] } = await getOrders()
  const tableData = orders.map((o) => ({ ...o } as Record<string, unknown>))

  return (
    <>
      <TipsBanner module="auftraege" />
      <OrderList orders={tableData} />
    </>
  )
}
