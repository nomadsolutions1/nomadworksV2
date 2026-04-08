import { getForemanList } from "@/lib/actions/sites"
import { getOrders } from "@/lib/actions/orders"
import { SiteNew } from "@/components/modules/sites/site-new"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Baustelle anlegen" }

export default async function NeueBaustellePage() {
  const [{ data: foremanList = [] }, { data: ordersList }] = await Promise.all([
    getForemanList(),
    getOrders(),
  ])

  const orders = (ordersList ?? []).map((o) => ({ id: o.id, title: o.title, budget: o.budget }))

  return <SiteNew foremanList={foremanList} orders={orders} />
}
