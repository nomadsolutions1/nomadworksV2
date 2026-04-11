"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, AlertTriangle, Plus, Moon, CalendarPlus } from "lucide-react"
import { AssignmentDialog } from "./assignment-dialog"
import { getSiteColor } from "@/lib/utils/colors"
import {
  getWeekDateStrings,
  formatShortDate,
  shiftWeek,
  getCurrentMonday,
  getISOWeekNumber,
  formatFullDate,
  isNightTime,
  isWeekendDate,
  getTodayString,
} from "@/lib/utils/dates"
import type { Assignment } from "@/lib/actions/disposition"

interface Employee {
  id: string
  first_name: string
  last_name: string
}

interface Site {
  id: string
  name: string
  status: string
}

interface WeekGridProps {
  assignments: Assignment[]
  employees: Employee[]
  sites: Site[]
  weekStart: string
}

const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

export function WeekGrid({ assignments, employees, sites, weekStart }: WeekGridProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [editingAssignment, setEditingAssignment] = useState<Assignment | undefined>()
  const [bulkModeStart, setBulkModeStart] = useState(false)

  const weekDates = getWeekDateStrings(weekStart)
  const today = getTodayString()
  const mondayDate = new Date(weekDates[0] + "T12:00:00")
  const kw = getISOWeekNumber(mondayDate)

  const siteColorMap = useMemo(() => {
    const map = new Map<string, number>()
    sites.forEach((site, index) => map.set(site.id, index))
    return map
  }, [sites])

  const assignmentLookup = useMemo(() => {
    const lookup = new Map<string, Map<string, Assignment[]>>()
    for (const a of assignments) {
      if (!lookup.has(a.user_id)) lookup.set(a.user_id, new Map())
      const userMap = lookup.get(a.user_id)!
      if (!userMap.has(a.date)) userMap.set(a.date, [])
      userMap.get(a.date)!.push(a)
    }
    return lookup
  }, [assignments])

  function openNewDialog(userId: string, date: string) {
    setSelectedUserId(userId)
    setSelectedDate(date)
    setEditingAssignment(undefined)
    setBulkModeStart(false)
    setDialogOpen(true)
  }

  function openEditDialog(assignment: Assignment) {
    setEditingAssignment(assignment)
    setSelectedDate(assignment.date)
    setSelectedUserId(assignment.user_id)
    setBulkModeStart(false)
    setDialogOpen(true)
  }

  function openWeekPlanDialog() {
    setEditingAssignment(undefined)
    setSelectedUserId("")
    setSelectedDate(weekDates[0])
    setBulkModeStart(true)
    setDialogOpen(true)
  }

  function navigateWeek(weeks: number) {
    router.push(`/disposition?week=${shiftWeek(weekStart, weeks)}`)
  }

  const dialogKey = editingAssignment
    ? `edit-${editingAssignment.id}`
    : `new-${selectedUserId}-${selectedDate}-${bulkModeStart ? "bulk" : "single"}`

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => navigateWeek(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-foreground min-w-[220px] text-center">
          KW {kw} — {formatFullDate(weekStart)} – {formatFullDate(weekDates[6])}
        </span>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => navigateWeek(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {weekStart !== getCurrentMonday() && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg ml-2 text-xs"
            onClick={() => router.push(`/disposition?week=${getCurrentMonday()}`)}
          >
            Heute
          </Button>
        )}
        <div className="ml-auto">
          <Button
            size="sm"
            className="rounded-lg gap-1.5 font-semibold"
            onClick={openWeekPlanDialog}
          >
            <CalendarPlus className="h-4 w-4" />
            Woche planen
          </Button>
        </div>
      </div>

      {/* Grid */}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase sticky left-0 bg-muted w-36 z-10">
                    Mitarbeiter
                  </th>
                  {weekDates.map((date, i) => {
                    const isToday = date === today
                    const isWe = isWeekendDate(date)
                    return (
                      <th
                        key={date}
                        className={`px-2 py-3 text-center text-xs font-medium uppercase min-w-[110px] ${
                          isToday ? "text-primary bg-primary/5" : isWe ? "text-warning bg-warning/5" : "text-muted-foreground"
                        }`}
                      >
                        <div>{DAY_LABELS[i]}</div>
                        <div className="font-normal normal-case text-[11px]">
                          {formatShortDate(date)}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Keine Mitarbeiter gefunden
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const userMap = assignmentLookup.get(emp.id) ?? new Map()
                    return (
                      <tr key={emp.id} className="border-b hover:bg-muted/30 group">
                        <td className="px-4 py-2 text-sm font-medium text-foreground sticky left-0 bg-background group-hover:bg-muted/30 z-10 w-36">
                          <div className="truncate max-w-[130px]">
                            {emp.first_name} {emp.last_name}
                          </div>
                        </td>
                        {weekDates.map((date) => {
                          const dayAssignments: Assignment[] = userMap.get(date) || []
                          const hasConflict = dayAssignments.length > 1

                          return (
                            <td key={date} className="px-2 py-2 min-w-[110px]">
                              {dayAssignments.length === 0 ? (
                                <button
                                  onClick={() => openNewDialog(emp.id, date)}
                                  aria-label={`Zuweisung erstellen für ${emp.first_name} ${emp.last_name} am ${formatShortDate(date)}`}
                                  className="w-full h-9 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                >
                                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              ) : (
                                <div className="space-y-1">
                                  {dayAssignments.map((a) => {
                                    const colorIndex = siteColorMap.get(a.site_id) ?? 0
                                    const color = getSiteColor(colorIndex)
                                    const isNight = a.start_time ? isNightTime(a.start_time) : false
                                    const timeLabel = a.start_time && a.end_time
                                      ? `${a.start_time}-${a.end_time}`
                                      : ""

                                    return (
                                      <button
                                        key={a.id}
                                        onClick={() => openEditDialog(a)}
                                        aria-label={`Zuweisung bearbeiten: ${a.site_name} ${a.start_time || ""}-${a.end_time || ""}`}
                                        className={`w-full px-2 py-1 rounded-lg text-[11px] font-medium text-left transition-opacity hover:opacity-80 ${
                                          hasConflict ? "ring-2 ring-destructive" : ""
                                        }`}
                                        style={{
                                          backgroundColor: `${color}22`,
                                          color,
                                          border: `1px solid ${color}55`,
                                        }}
                                        title={`${a.site_name} ${timeLabel}`}
                                      >
                                        <div className="flex items-center gap-1">
                                          {hasConflict && (
                                            <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                                          )}
                                          {isNight && (
                                            <Moon className="h-3 w-3 flex-shrink-0 opacity-70" />
                                          )}
                                          <span className="truncate">{a.site_name}</span>
                                        </div>
                                        {timeLabel && (
                                          <div className="text-[10px] opacity-70">{timeLabel}</div>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AssignmentDialog
        key={dialogKey}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        prefilledDate={selectedDate}
        prefilledUserId={selectedUserId}
        existingAssignment={editingAssignment}
        employees={employees}
        sites={sites}
        weekStart={weekStart}
        startInBulkMode={bulkModeStart}
      />
    </div>
  )
}
