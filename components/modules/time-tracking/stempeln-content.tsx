"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/layout/page-header"
import { Clock } from "lucide-react"
import { ClockWidget } from "./clock-widget"
import { AssignmentInfo } from "./assignment-info"
import { TimeEntryRow } from "./time-entry-row"
import { WeekNavigator } from "./week-navigator"
import { formatHours } from "@/lib/utils/format"
import type { OpenTimeEntry, TimeEntry, AssignedSiteInfo } from "@/lib/actions/time-entries"

interface StempelnContentProps {
  openEntry: OpenTimeEntry | null
  sites: { id: string; name: string }[]
  assignedSite: AssignedSiteInfo | null
  todayEntries: TimeEntry[]
  weekEntries: TimeEntry[]
  weekStart: string
}

export function StempelnContent({
  openEntry,
  sites,
  assignedSite,
  todayEntries,
  weekEntries,
  weekStart,
}: StempelnContentProps) {
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.total_minutes, 0)
  const weekTotal = weekEntries.reduce((sum, e) => sum + e.total_minutes, 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Stempeluhr"
        description="Ein- und Ausstempeln, Stundenübersicht"
      />

      {assignedSite && <AssignmentInfo assignment={assignedSite} />}

      <ClockWidget
        openEntry={openEntry}
        sites={sites}
        assignedSiteId={assignedSite?.site_id}
      />

      {/* Today's entries */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold font-heading">
              Heute
            </CardTitle>
            {todayTotal > 0 && (
              <span className="text-sm font-mono font-semibold text-foreground">
                {formatHours(todayTotal)}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {todayEntries.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Noch keine Einträge heute"
              description="Stempeln Sie ein, um Ihre Arbeitszeit zu erfassen."
            />
          ) : (
            <div className="space-y-2">
              {todayEntries.map((entry) => (
                <TimeEntryRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week view */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold font-heading">
              Wochenübersicht
            </CardTitle>
            <WeekNavigator weekStart={weekStart} />
          </div>
          {weekTotal > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Gesamt:</span>
              <span className="text-sm font-mono font-semibold text-foreground">
                {formatHours(weekTotal)}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {weekEntries.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Keine Einträge diese Woche"
              description="Für diese Woche wurden noch keine Arbeitszeiten erfasst."
            />
          ) : (
            <div className="space-y-2">
              {weekEntries.map((entry) => (
                <TimeEntryRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
