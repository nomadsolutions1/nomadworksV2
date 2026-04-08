"use client"

import { useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { WeekNavigator } from "./week-navigator"
import { formatDate, formatDateTime } from "@/lib/utils/format"
import type { Column } from "@/components/shared/data-table"

type EntryRow = Record<string, unknown>

interface ZeiterfassungContentProps {
  entries: EntryRow[]
  employees: { id: string; name: string }[]
  sites: { id: string; name: string }[]
  weekStart: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

const timeColumns: Column<EntryRow>[] = [
  { key: "user_name", header: "Mitarbeiter", sortable: true },
  { key: "site_name", header: "Baustelle", sortable: true },
  {
    key: "clock_in",
    header: "Datum",
    sortable: true,
    render: (e) => formatDate(e.clock_in as string),
  },
  {
    key: "clock_in_time",
    header: "Von",
    render: (e) => e.clock_in ? formatTime(e.clock_in as string) : "–",
  },
  {
    key: "clock_out_time",
    header: "Bis",
    render: (e) => {
      if (!e.clock_out) return <span className="text-warning font-medium">Offen</span>
      return formatTime(e.clock_out as string)
    },
  },
  {
    key: "break_minutes",
    header: "Pause",
    render: (e) => `${e.break_minutes} Min`,
  },
  {
    key: "total_hours",
    header: "Stunden",
    sortable: true,
    render: (e) => (
      <span className="font-semibold text-foreground">
        {((e.total_hours as number) ?? 0).toFixed(2).replace(".", ",")} h
      </span>
    ),
  },
]

export function ZeiterfassungContent({
  entries,
  employees,
  sites,
  weekStart,
}: ZeiterfassungContentProps) {
  const [filterUserId, setFilterUserId] = useState("all")
  const [filterSiteId, setFilterSiteId] = useState("all")

  const filtered = entries.filter((e) => {
    if (filterUserId !== "all" && e.user_id !== filterUserId) return false
    if (filterSiteId !== "all" && e.site_id !== filterSiteId) return false
    return true
  })

  const totalHours = filtered.reduce((sum, e) => sum + ((e.total_hours as number) ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zeitübersicht"
        description="Zeiteinträge aller Mitarbeiter dieser Woche."
      />

      <WeekNavigator weekStart={weekStart} basePath="/disposition/zeiterfassung" />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterUserId} onValueChange={(v) => setFilterUserId(v ?? "all")}>
          <SelectTrigger className="h-9 rounded-xl w-[180px] text-sm">
            <SelectValue placeholder="Alle Mitarbeiter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Mitarbeiter</SelectItem>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSiteId} onValueChange={(v) => setFilterSiteId(v ?? "all")}>
          <SelectTrigger className="h-9 rounded-xl w-[180px] text-sm">
            <SelectValue placeholder="Alle Baustellen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Baustellen</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-muted-foreground">
          {filtered.length} Einträge ·{" "}
          <strong className="text-foreground">{totalHours.toFixed(2).replace(".", ",")} Std.</strong>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <DataTable
            columns={timeColumns}
            data={filtered}
            searchKey="user_name"
            searchPlaceholder="Mitarbeiter suchen..."
            pageSize={15}
            emptyState={{
              icon: Clock,
              title: "Keine Zeiteinträge",
              description: "Für diese Woche und Filter wurden keine Zeiteinträge gefunden.",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
