import { notFound } from "next/navigation"
import { getVehicle, listFuelLogs, listTripLogs } from "@/lib/actions/fleet"
import { VehicleDetail } from "@/components/modules/fleet/vehicle-detail"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getVehicle(id)
  if (!data) return { title: "Fahrzeug nicht gefunden" }
  return { title: `${data.license_plate} – ${data.make} ${data.model}` }
}

export default async function FahrzeugDetailPage({ params }: Props) {
  const { id } = await params
  const [vehicleRes, fuelRes, tripRes] = await Promise.all([
    getVehicle(id),
    listFuelLogs(id),
    listTripLogs(id),
  ])

  if (!vehicleRes.data) notFound()

  return (
    <VehicleDetail
      vehicle={vehicleRes.data}
      fuelEntries={fuelRes.data ?? []}
      tripEntries={tripRes.data ?? []}
    />
  )
}
