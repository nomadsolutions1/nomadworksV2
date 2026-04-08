import { getMonthlyTimeEntries } from "@/lib/actions/time-entries"
import { getEmployees } from "@/lib/actions/employees"
import { StundennachweisOverview } from "@/components/modules/diary/stundennachweis-overview"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Stundennachweise" }

export default async function StundennachweisePage() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

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

  return <StundennachweisOverview employees={employees} entries={entries} />
}
