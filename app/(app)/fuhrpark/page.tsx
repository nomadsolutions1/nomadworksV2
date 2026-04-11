import {
  getFleetStats,
  listVehicles,
  listEquipment,
  listWorkshopEntries,
} from "@/lib/actions/fleet"
import { FleetOverview } from "@/components/modules/fleet/fleet-overview"
import { TipsBanner } from "@/components/shared/tips-banner"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Fuhrpark" }

export default async function FuhrparkPage() {
  const [stats, vehiclesResult, equipmentResult, workshopResult] = await Promise.all([
    getFleetStats(),
    listVehicles(),
    listEquipment(),
    listWorkshopEntries(),
  ])

  const vehicles = vehiclesResult.data ?? []
  const equipment = equipmentResult.data ?? []
  const workshopEntries = workshopResult.data ?? []
  const activeWorkshop = workshopEntries.filter(
    (e) => e.status === "received" || e.status === "in_repair"
  )

  return (
    <>
      <TipsBanner module="fuhrpark" />
      <FleetOverview
        stats={stats}
        vehicles={vehicles}
        equipment={equipment}
        activeWorkshop={activeWorkshop}
      />
    </>
  )
}
