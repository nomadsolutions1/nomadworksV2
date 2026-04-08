import { notFound } from "next/navigation"
import { getOrder, getOrderItems, getOrderCosts, getOrderMeasurements, getOrderFinancials, getOrderTeam } from "@/lib/actions/orders"
import { OrderDetail } from "@/components/modules/orders/order-detail"
import type { Metadata } from "next"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data: order } = await getOrder(id)
  return { title: order ? order.title : "Auftrag" }
}

export default async function AuftragDetailPage({ params }: Props) {
  const { id } = await params

  const [
    { data: order },
    { data: items = [] },
    { data: costsByCategory = [] },
    { data: measurements = [] },
    { data: financials },
    { data: team = [] },
  ] = await Promise.all([
    getOrder(id),
    getOrderItems(id),
    getOrderCosts(id),
    getOrderMeasurements(id),
    getOrderFinancials(id),
    getOrderTeam(id),
  ])

  if (!order) notFound()

  const orderValue = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  const budget = order.budget ?? orderValue

  const fin = financials ?? {
    budget,
    totalCosts: 0,
    margin: budget,
    marginPercent: 100,
    costsByCategory: {},
    budgetUsedPercent: 0,
  }

  return (
    <OrderDetail
      order={order}
      items={items}
      costsByCategory={costsByCategory}
      measurements={measurements}
      financials={fin}
      team={team}
      orderValue={orderValue}
    />
  )
}
