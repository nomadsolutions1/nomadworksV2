"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, ChevronDown, ChevronUp } from "lucide-react"
import { getSiteColor } from "@/lib/utils/colors"
import { formatShortDate } from "@/lib/utils/dates"
import type { EmployeeCapacity } from "@/lib/actions/disposition"

interface Site { id: string; name: string; status: string }

interface CapacityViewProps {
  capacities: EmployeeCapacity[]
  sites: Site[]
}

const DAY_LABELS: Record<number, string> = {
  0: "Mo", 1: "Di", 2: "Mi", 3: "Do", 4: "Fr", 5: "Sa", 6: "So",
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  const day = d.getDay()
  const idx = day === 0 ? 6 : day - 1
  return `${DAY_LABELS[idx]} ${formatShortDate(dateStr)}`
}

function getCapacityColor(pct: number): { bar: string; badge: string } {
  if (pct <= 60) return { bar: "hsl(var(--success))", badge: "bg-success/10 text-success" }
  if (pct <= 80) return { bar: "hsl(var(--warning))", badge: "bg-warning/10 text-warning" }
  return { bar: "hsl(var(--destructive))", badge: "bg-destructive/10 text-destructive" }
}

function CapacityRow({ capacity, siteColorMap }: { capacity: EmployeeCapacity; siteColorMap: Map<string, number> }) {
  const [expanded, setExpanded] = useState(false)
  const pct = Math.round((capacity.assigned_days / capacity.total_workdays) * 100)
  const colors = getCapacityColor(pct)

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-foreground">{capacity.user_name}</span>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                {capacity.assigned_days} / {capacity.total_workdays} Tage
              </span>
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, pct)}%`, backgroundColor: colors.bar }}
            />
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t bg-muted/30 px-4 py-3">
          {capacity.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-1">Keine Einsätze diese Woche</p>
          ) : (
            <div className="space-y-2">
              {capacity.assignments.map((a) => {
                const colorIndex = siteColorMap.get(a.site_id) ?? 0
                const color = getSiteColor(colorIndex)
                return (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground text-xs w-14 flex-shrink-0">
                      {getDayLabel(a.date)}
                    </span>
                    <Badge
                      className="text-xs font-medium rounded-lg px-2 py-0.5"
                      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
                    >
                      {a.site_name}
                    </Badge>
                    {a.start_time && a.end_time && (
                      <span className="text-xs text-muted-foreground">
                        {a.start_time}-{a.end_time}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CapacityView({ capacities, sites }: CapacityViewProps) {
  const siteColorMap = new Map<string, number>()
  sites.forEach((site, index) => siteColorMap.set(site.id, index))

  const totalEmployees = capacities.length
  const fullyBooked = capacities.filter((c) => Math.round((c.assigned_days / c.total_workdays) * 100) >= 80).length
  const unassigned = capacities.filter((c) => c.assigned_days === 0).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-primary">{totalEmployees}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Mitarbeiter gesamt</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-warning">{fullyBooked}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Hoch ausgelastet</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-muted-foreground">{unassigned}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Nicht eingeplant</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-primary">Auslastung dieser Woche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {capacities.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              Keine Mitarbeiter gefunden
            </div>
          ) : (
            capacities.map((c) => (
              <CapacityRow key={c.user_id} capacity={c} siteColorMap={siteColorMap} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
