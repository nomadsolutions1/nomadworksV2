"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Moon } from "lucide-react"
import { getSiteColor } from "@/lib/utils/colors"
import { getWeekdayName, formatFullDate, getTodayString, isNightTime } from "@/lib/utils/dates"
import type { Assignment } from "@/lib/actions/disposition"

const HOURS = Array.from({ length: 24 }, (_, i) => i) // 0-23 (full 24h for night shifts)
const HOUR_HEIGHT = 36

interface DayViewProps {
  date: string
  assignments: Assignment[]
  onDateChange: (date: string) => void
}

function timeToMinutes(time: string | null): number {
  if (!time) return 7 * 60
  const [h, m] = time.split(":").map(Number)
  return h * 60 + (m || 0)
}

export function DayView({ date, assignments, onDateChange }: DayViewProps) {
  const dayAssignments = assignments.filter((a) => a.date === date)

  const bySite = new Map<string, { name: string; assignments: Assignment[] }>()
  for (const a of dayAssignments) {
    if (!bySite.has(a.site_id)) bySite.set(a.site_id, { name: a.site_name, assignments: [] })
    bySite.get(a.site_id)!.assignments.push(a)
  }
  const siteEntries = Array.from(bySite.entries())

  function shiftDate(days: number) {
    const d = new Date(date + "T12:00:00")
    d.setDate(d.getDate() + days)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    onDateChange(`${y}-${m}-${dd}`)
  }

  const totalMA = new Set(dayAssignments.map((a) => a.user_id)).size
  const isToday = date === getTodayString()

  return (
    <Card className="rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(-1)} aria-label="Vorheriger Tag">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base font-semibold">
              {formatFullDate(date)} ({getWeekdayName(date)})
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(1)} aria-label="Naechster Tag">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {!isToday && (
            <button
              onClick={() => onDateChange(getTodayString())}
              className="text-xs text-primary hover:underline"
              aria-label="Zum heutigen Tag springen"
            >
              Heute
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {siteEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Keine Zuweisungen fuer diesen Tag.
          </p>
        ) : (
          <div className="flex">
            <div className="w-14 shrink-0 border-r border-border">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className={`border-b border-border/30 text-[10px] pr-2 text-right ${
                    h >= 22 || h < 6 ? "text-warning" : "text-muted-foreground"
                  }`}
                  style={{ height: HOUR_HEIGHT }}
                >
                  {h}:00
                </div>
              ))}
            </div>
            {siteEntries.map(([siteId, { name, assignments: siteAssigns }], si) => (
              <div key={siteId} className="flex-1 min-w-[140px] border-r border-border last:border-r-0 relative">
                <div className="bg-muted border-b border-border px-2 py-1.5 text-xs font-semibold text-foreground sticky top-0">
                  {name}
                </div>
                <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
                  {HOURS.map((h) => (
                    <div key={h} className="absolute w-full border-b border-border/20" style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }} />
                  ))}
                  {siteAssigns.map((a, ai) => {
                    const startMin = timeToMinutes(a.start_time)
                    const endMin = timeToMinutes(a.end_time) || startMin + 480
                    const top = (startMin / 60) * HOUR_HEIGHT
                    const height = ((endMin > startMin ? endMin - startMin : endMin + 1440 - startMin) / 60) * HOUR_HEIGHT
                    const color = getSiteColor((si + ai) % 10)
                    const isNight = a.start_time ? isNightTime(a.start_time) : false

                    return (
                      <div
                        key={a.id}
                        className="absolute left-1 right-1 rounded-md text-[10px] text-white font-medium px-1.5 py-1 shadow-sm overflow-hidden"
                        style={{ top: Math.max(0, top), height: Math.max(24, height), backgroundColor: color }}
                        title={`${a.user_name} · ${a.start_time || "?"} - ${a.end_time || "?"}`}
                      >
                        <div className="flex items-center gap-1">
                          {isNight && <Moon className="h-3 w-3" />}
                          {a.user_name}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          {totalMA} Mitarbeiter · {siteEntries.length} Baustelle{siteEntries.length !== 1 ? "n" : ""}
        </div>
      </CardContent>
    </Card>
  )
}
