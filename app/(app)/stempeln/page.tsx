import { getMyOpenEntry, getMyTimeEntries, getTodayAssignment, getActiveSitesForClockIn } from "@/lib/actions/time-entries"
import { getCurrentMonday } from "@/lib/utils/dates"
import { StempelnContent } from "@/components/modules/time-tracking/stempeln-content"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Stempeluhr" }

export default async function StempelnPage() {
  const weekStart = getCurrentMonday()

  const [openResult, sitesResult, assignedResult, weekResult] = await Promise.all([
    getMyOpenEntry(),
    getActiveSitesForClockIn(),
    getTodayAssignment(),
    getMyTimeEntries(weekStart),
  ])

  const openEntry = openResult.data ?? null
  const sites = sitesResult.data ?? []
  const assignedSite = assignedResult.data ?? null
  const weekEntries = weekResult.data ?? []

  // Reorder sites: assigned site first
  const orderedSites = assignedSite
    ? [
        ...sites.filter((s) => s.id === assignedSite.site_id),
        ...sites.filter((s) => s.id !== assignedSite.site_id),
      ]
    : sites

  // Split today vs rest
  const today = new Date().toISOString().split("T")[0]
  const todayEntries = weekEntries.filter((e) => e.clock_in.startsWith(today))

  return (
    <StempelnContent
      openEntry={openEntry}
      sites={orderedSites}
      assignedSite={assignedSite}
      todayEntries={todayEntries}
      weekEntries={weekEntries}
      weekStart={weekStart}
    />
  )
}
