import { listWorkshopEntries, listVehicles, listEquipment } from "@/lib/actions/fleet"
import { WorkshopEntryList } from "@/components/modules/fleet/workshop-entry-list"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Werkstatt" }

export default async function WerkstattPage() {
  const [workshopRes, vehiclesRes, equipmentRes] = await Promise.all([
    listWorkshopEntries(),
    listVehicles(),
    listEquipment(),
  ])

  const entries = workshopRes.data ?? []
  const vehicles = vehiclesRes.data ?? []
  const equipment = equipmentRes.data ?? []

  // Serializable lookup maps
  const vehicleMap: Record<string, string> = {}
  for (const v of vehicles) {
    vehicleMap[v.id] = `${v.make} ${v.model} (${v.license_plate})`
  }
  const equipmentMap: Record<string, string> = {}
  for (const e of equipment) {
    equipmentMap[e.id] = e.name
  }

  const active = entries.filter((e) => e.status === "received" || e.status === "in_repair").length
  const inRepair = entries.filter((e) => e.status === "in_repair").length
  const done = entries.filter((e) => e.status === "done").length

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthlyTotal = entries
    .filter((e) => new Date(e.entered_at) >= monthStart)
    .reduce(
      (sum, e) => sum + (e.cost_parts ?? 0) + (e.cost_labor ?? 0) + (e.cost_external ?? 0),
      0
    )

  const activeEntries = entries.filter(
    (e) => e.status === "received" || e.status === "in_repair"
  )
  const completedEntries = entries.filter(
    (e) => e.status === "done" || e.status === "picked_up"
  )

  return (
    <WorkshopEntryList
      entries={entries}
      vehicleMap={vehicleMap}
      equipmentMap={equipmentMap}
      stats={{ active, inRepair, done, monthlyTotal }}
      activeEntries={activeEntries}
      completedEntries={completedEntries}
    />
  )
}
