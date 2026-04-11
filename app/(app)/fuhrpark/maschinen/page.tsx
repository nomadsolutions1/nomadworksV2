import { listEquipment } from "@/lib/actions/fleet"
import { EquipmentList } from "@/components/modules/fleet/equipment-list"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Maschinen & Geräte" }

export default async function MaschinenPage() {
  const result = await listEquipment()
  const equipment = result.data ?? []

  const available = equipment.filter((e) => e.availability_status === "available").length
  const inUse = equipment.filter((e) => e.availability_status === "in_use").length
  const workshop = equipment.filter((e) => e.availability_status === "workshop").length

  const today = new Date().toISOString().split("T")[0]
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const maintenanceCount = equipment.filter(
    (e) => e.next_maintenance && e.next_maintenance >= today && e.next_maintenance <= thirtyDays
  ).length

  return (
    <EquipmentList
      equipment={equipment}
      available={available}
      inUse={inUse}
      workshop={workshop}
      maintenanceCount={maintenanceCount}
    />
  )
}
