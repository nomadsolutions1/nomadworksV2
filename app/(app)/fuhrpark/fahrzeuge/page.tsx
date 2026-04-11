import { listVehicles } from "@/lib/actions/fleet"
import { VehicleList } from "@/components/modules/fleet/vehicle-list"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Fahrzeuge" }

export default async function FahrzeugePage() {
  const result = await listVehicles()
  const vehicles = result.data ?? []

  const available = vehicles.filter((v) => v.availability_status === "available").length
  const inUse = vehicles.filter((v) => v.availability_status === "in_use").length
  const workshop = vehicles.filter((v) => v.availability_status === "workshop").length

  const today = new Date().toISOString().split("T")[0]
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const tuevCount = vehicles.filter(
    (v) => v.next_inspection && v.next_inspection >= today && v.next_inspection <= thirtyDays
  ).length

  return (
    <VehicleList
      vehicles={vehicles}
      available={available}
      inUse={inUse}
      workshop={workshop}
      tuevCount={tuevCount}
    />
  )
}
