import { notFound } from "next/navigation"
import { getMaterial, listSuppliers, listStockMovements } from "@/lib/actions/inventory"
import { MaterialDetail } from "@/components/modules/inventory/material-detail"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getMaterial(id)
  if (!data) return { title: "Material nicht gefunden" }
  return { title: data.name }
}

export default async function MaterialDetailPage({ params }: Props) {
  const { id } = await params

  const [materialRes, suppliersRes, movementsRes] = await Promise.all([
    getMaterial(id),
    listSuppliers(),
    listStockMovements(id),
  ])

  if (!materialRes.data) notFound()

  return (
    <MaterialDetail
      material={materialRes.data}
      suppliers={suppliersRes.data ?? []}
      movements={movementsRes.data ?? []}
    />
  )
}
