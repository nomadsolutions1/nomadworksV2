import { getWeekAssignments, getCapacities } from "@/lib/actions/disposition"
import { getEmployees } from "@/lib/actions/employees"
import { getSites } from "@/lib/actions/sites"
import { getCurrentMonday } from "@/lib/utils/dates"
import { DispositionContent } from "@/components/modules/disposition/disposition-content"
import { TipsBanner } from "@/components/shared/tips-banner"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Disposition" }

type SearchParams = { week?: string }

export default async function DispositionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const weekStart = sp.week || getCurrentMonday()

  const [assignRes, capRes, empRes, sitesRes] = await Promise.all([
    getWeekAssignments(weekStart),
    getCapacities(weekStart),
    getEmployees(),
    getSites(),
  ])

  const assignments = assignRes.data ?? []
  const capacities = capRes.data ?? []
  const employees = (empRes.data ?? []).map((e) => ({
    id: e.id,
    first_name: e.first_name,
    last_name: e.last_name,
  }))
  const sites = (sitesRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
  }))

  return (
    <>
      <TipsBanner module="disposition" />
      <DispositionContent
        assignments={assignments}
        capacities={capacities}
        employees={employees}
        sites={sites}
        weekStart={weekStart}
      />
    </>
  )
}
