"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Moon } from "lucide-react"
import { getSiteColor } from "@/lib/utils/colors"
import { getWeekdayName, formatFullDate, getTodayString, isNightTime } from "@/lib/utils/dates"
import type { Assignment } from "@/lib/actions/disposition"

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const TOTAL_MINUTES = 24 * 60

interface TimelineViewProps {
  date: string
  assignments: Assignment[]
  employees: { id: string; name: string }[]
  onDateChange: (date: string) => void
}

function timeToMinutes(time: string | null): number {
  if (!time) return 7 * 60
  const [h, m] = time.split(":").map(Number)
  return h * 60 + (m || 0)
}

export function TimelineView({ date, assignments, employees, onDateChange }: TimelineViewProps) {
  const dayAssignments = assignments.filter((a) => a.date === date)
  const isToday = date === getTodayString()

  function shiftDate(days: number) {
    const d = new Date(date + "T12:00:00")
    d.setDate(d.getDate() + days)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    onDateChange(`${y}-${m}-${dd}`)
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentPercent = isToday ? (currentMinutes / TOTAL_MINUTES) * 100 : -1

  return (
    <Card className="rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base font-semibold">
              {formatFullDate(date)} ({getWeekdayName(date)})
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {!isToday && (
            <button onClick={() => onDateChange(getTodayString())} className="text-xs text-primary hover:underline">
              Heute
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="flex border-b border-border">
            <div className="w-40 shrink-0" />
            <div className="flex-1 flex relative">
              {HOURS.filter((h) => h % 2 === 0).map((h) => (
                <div
                  key={h}
                  className={`text-[10px] border-l border-border/30 ${
                    h >= 22 || h < 6 ? "text-warning" : "text-muted-foreground"
                  }`}
                  style={{ width: `${100 / 12}%` }}
                >
                  {h}
                </div>
              ))}
            </div>
          </div>
          {employees.map((emp) => {
            const empAssigns = dayAssignments.filter((a) => a.user_id === emp.id)
            return (
              <div key={emp.id} className="flex border-b border-border/30 hover:bg-muted/30" style={{ minHeight: 56 }}>
                <div className="w-40 shrink-0 flex items-center px-3 text-sm font-medium text-foreground border-r border-border">
                  {emp.name}
                </div>
                <div className="flex-1 relative py-2">
                  {HOURS.filter((h) => h % 2 === 0).map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 border-l border-border/20"
                      style={{ left: `${(h / 24) * 100}%` }}
                    />
                  ))}
                  {currentPercent >= 0 && currentPercent <= 100 && (
                    <div
                      className="absolute top-0 bottom-0 border-l-2 border-destructive z-10"
                      style={{ left: `${currentPercent}%` }}
                    />
                  )}
                  {empAssigns.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground border-b border-dashed border-border px-2">
                        nicht eingeplant
                      </span>
                    </div>
                  )}
                  {empAssigns.map((a) => {
                    const startMin = timeToMinutes(a.start_time)
                    const endMin = timeToMinutes(a.end_time) || startMin + 480
                    const left = (startMin / TOTAL_MINUTES) * 100
                    const width = ((endMin > startMin ? endMin - startMin : endMin + 1440 - startMin) / TOTAL_MINUTES) * 100
                    const color = getSiteColor(a.site_id.charCodeAt(0) % 10)
                    const isNight = a.start_time ? isNightTime(a.start_time) : false

                    return (
                      <div
                        key={a.id}
                        className="absolute top-1.5 bottom-1.5 rounded-md text-[10px] text-white font-medium px-1.5 flex items-center shadow-sm overflow-hidden gap-1"
                        style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(width, 100 - left)}%`, backgroundColor: color }}
                        title={`${a.site_name} · ${a.user_name} · ${a.start_time || "?"}-${a.end_time || "?"}`}
                      >
                        {isNight && <Moon className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{a.site_name} ({a.start_time}-{a.end_time})</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
