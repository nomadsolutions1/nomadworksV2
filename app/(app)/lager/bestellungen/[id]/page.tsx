import { notFound } from "next/navigation"
import {
  getPurchaseOrder,
  listPurchaseOrderItems,
  listMaterials,
} from "@/lib/actions/inventory"
import { PurchaseOrderDetail } from "@/components/modules/inventory/purchase-order-detail"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getPurchaseOrder(id)
  if (!data) return { title: "Bestellung nicht gefunden" }
  return { title: `Bestellung #${id.slice(0, 8)}` }
}

export default async function BestellungDetailPage({ params }: Props) {
  const { id } = await params

  const [orderRes, itemsRes, materialsRes] = await Promise.all([
    getPurchaseOrder(id),
    listPurchaseOrderItems(id),
    listMaterials(),
  ])

  if (!orderRes.data) notFound()

  return (
    <PurchaseOrderDetail
      order={orderRes.data}
      items={itemsRes.data ?? []}
      materials={materialsRes.data ?? []}
      orderId={id}
    />
  )
}
