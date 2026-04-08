import { getMonthlyTimeEntries } from "@/lib/actions/time-entries"
import { getEmployees } from "@/lib/actions/employees"
import { StundenzettelContent } from "@/components/modules/time-tracking/stundenzettel-content"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Stundenzettel" }

type SearchParams = { month?: string; year?: string }

export default async function StundenzettelPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const now = new Date()
  const month = sp.month ? parseInt(sp.month, 10) : now.getMonth() + 1
  const year = sp.year ? parseInt(sp.year, 10) : now.getFullYear()

  const [entriesResult, employeesResult] = await Promise.all([
    getMonthlyTimeEntries(month, year),
    getEmployees(),
  ])

  const entries = entriesResult.data ?? []
  const employees = (employeesResult.data ?? []).map((e) => ({
    id: e.id,
    first_name: e.first_name,
    last_name: e.last_name,
    job_title: e.job_title ?? null,
    hourly_rate: e.hourly_rate ?? null,
  }))

  return (
    <StundenzettelContent
      entries={entries}
      employees={employees}
      month={month}
      year={year}
    />
  )
}
