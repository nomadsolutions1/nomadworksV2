import { notFound } from "next/navigation"
import { getSupplier } from "@/lib/actions/inventory"
import { SupplierDetail } from "@/components/modules/inventory/supplier-detail"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getSupplier(id)
  if (!data) return { title: "Lieferant nicht gefunden" }
  return { title: data.name }
}

export default async function LieferantDetailPage({ params }: Props) {
  const { id } = await params
  const { data: supplier } = await getSupplier(id)
  if (!supplier) notFound()
  return <SupplierDetail supplier={supplier} />
}
