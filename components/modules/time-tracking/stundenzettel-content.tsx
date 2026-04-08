"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { ChevronLeft, ChevronRight, FileText, Printer } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import type { TimeEntry } from "@/lib/actions/time-entries"

interface Employee {
  id: string
  first_name: string
  last_name: string
  job_title: string | null
  hourly_rate: number | null
}

interface StundenzettelContentProps {
  entries: TimeEntry[]
  employees: Employee[]
  month: number
  year: number
}

const MONTHS = [
  "Januar", "Februar", "Maerz", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
]

export function StundenzettelContent({ entries, employees, month, year }: StundenzettelContentProps) {
  const router = useRouter()

  const byEmployee = employees
    .map((emp) => {
      const empEntries = entries.filter((e) => e.user_id === emp.id)
      const totalMinutes = empEntries.reduce((sum, e) => sum + e.total_minutes, 0)
      const totalHours = totalMinutes / 60
      const wage = emp.hourly_rate ? totalHours * emp.hourly_rate : null
      return { employee: emp, entries: empEntries, totalHours, totalMinutes, wage }
    })
    .filter((r) => r.totalMinutes > 0)

  const grandTotalHours = byEmployee.reduce((s, r) => s + r.totalHours, 0)

  function navigateMonth(direction: -1 | 1) {
    const newMonth = month + direction
    const newYear = newMonth <= 0 ? year - 1 : newMonth > 12 ? year + 1 : year
    const m = newMonth <= 0 ? 12 : newMonth > 12 ? 1 : newMonth
    router.push(`/stundenzettel?month=${m}&year=${newYear}`)
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Stempeluhr", href: "/stempeln" },
        { label: "Stundenzettel" },
      ]} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Stundenzettel</h1>
          <p className="text-sm text-muted-foreground mt-1">Monatsuebersicht aller Mitarbeiter-Stunden</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="rounded-lg h-9 w-9" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <Button variant="outline" size="icon" className="rounded-lg h-9 w-9" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Drucken
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {MONTHS[month - 1]} {year} — {byEmployee.length} Mitarbeiter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {byEmployee.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Keine Zeiteinträge in diesem Monat.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Mitarbeiter</th>
                    <th className="pb-3 font-medium text-right">Einträge</th>
                    <th className="pb-3 font-medium text-right">Stunden</th>
                    <th className="pb-3 font-medium text-right">Stundensatz</th>
                    <th className="pb-3 font-medium text-right">Lohn</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {byEmployee.map(({ employee, entries: empEntries, totalHours, wage }) => (
                    <tr key={employee.id} className="hover:bg-muted/50">
                      <td className="py-3 font-medium text-foreground">
                        {employee.first_name} {employee.last_name}
                        {employee.job_title && (
                          <span className="text-xs text-muted-foreground ml-2">{employee.job_title}</span>
                        )}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">{empEntries.length}</td>
                      <td className="py-3 text-right font-mono font-medium">{totalHours.toFixed(1)} h</td>
                      <td className="py-3 text-right text-muted-foreground">
                        {employee.hourly_rate ? formatCurrency(employee.hourly_rate) : "\u2014"}
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-foreground">
                        {wage != null ? formatCurrency(wage) : "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td className="pt-3">Gesamt</td>
                    <td className="pt-3 text-right">{entries.length}</td>
                    <td className="pt-3 text-right font-mono">{grandTotalHours.toFixed(1)} h</td>
                    <td />
                    <td className="pt-3 text-right font-mono">
                      {formatCurrency(byEmployee.reduce((s, r) => s + (r.wage ?? 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
