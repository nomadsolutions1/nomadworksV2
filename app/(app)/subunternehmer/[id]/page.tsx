import { notFound } from "next/navigation"
import {
  getSubcontractor,
  listAssignments,
} from "@/lib/actions/subcontractors"
import { getOrders } from "@/lib/actions/orders"
import { SubcontractorDetail } from "@/components/modules/subcontractors/subcontractor-detail"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getSubcontractor(id)
  if (!data) return { title: "Subunternehmer nicht gefunden" }
  return { title: data.name }
}

export default async function SubunternehmerDetailPage({ params }: Props) {
  const { id } = await params

  const [subRes, assignmentsRes, ordersRes] = await Promise.all([
    getSubcontractor(id),
    listAssignments(id),
    getOrders(),
  ])

  if (!subRes.data) notFound()

  const orderOptions = (ordersRes.data ?? []).map((o) => ({
    id: o.id,
    title: o.title,
  }))

  return (
    <SubcontractorDetail
      sub={subRes.data}
      assignments={assignmentsRes.data ?? []}
      orderOptions={orderOptions}
    />
  )
}
