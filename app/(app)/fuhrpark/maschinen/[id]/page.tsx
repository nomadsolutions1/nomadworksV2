import { notFound } from "next/navigation"
import { getEquipment } from "@/lib/actions/fleet"
import { EquipmentDetail } from "@/components/modules/fleet/equipment-detail"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getEquipment(id)
  if (!data) return { title: "Maschine nicht gefunden" }
  return { title: data.name }
}

export default async function MaschineDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getEquipment(id)
  if (!result.data) notFound()

  return <EquipmentDetail equipment={result.data} />
}
