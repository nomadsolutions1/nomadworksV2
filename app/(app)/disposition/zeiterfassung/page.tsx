import { getAllTimeEntries } from "@/lib/actions/time-entries"
import { getEmployees } from "@/lib/actions/employees"
import { getSites } from "@/lib/actions/sites"
import { getCurrentMonday } from "@/lib/utils/dates"
import { ZeiterfassungContent } from "@/components/modules/disposition/zeiterfassung-content"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Zeitübersicht" }

type SearchParams = { week?: string }

export default async function ZeiterfassungPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const weekStart = sp.week || getCurrentMonday()

  const [entriesRes, empRes, sitesRes] = await Promise.all([
    getAllTimeEntries(weekStart),
    getEmployees(),
    getSites(),
  ])

  const entries = (entriesRes.data ?? []).map((e) => ({ ...e } as Record<string, unknown>))
  const employees = (empRes.data ?? []).map((e) => ({
    id: e.id,
    name: `${e.first_name} ${e.last_name}`,
  }))
  const sites = (sitesRes.data ?? []).map((s) => ({ id: s.id, name: s.name }))

  return (
    <ZeiterfassungContent
      entries={entries}
      employees={employees}
      sites={sites}
      weekStart={weekStart}
    />
  )
}
