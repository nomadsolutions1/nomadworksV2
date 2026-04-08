"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import {
  getISOWeekNumber,
  shiftWeek,
  getCurrentMonday,
  formatFullDate,
  getWeekDateStrings,
} from "@/lib/utils/dates"

interface WeekNavigatorProps {
  weekStart: string
  className?: string
}

export function WeekNavigator({ weekStart, className }: WeekNavigatorProps) {
  const router = useRouter()

  const weekDates = getWeekDateStrings(weekStart)
  const mondayDate = new Date(weekDates[0] + "T12:00:00")
  const kw = getISOWeekNumber(mondayDate)
  const label = `${formatFullDate(weekStart)} – ${formatFullDate(weekDates[6])}`
  const todayMonday = getCurrentMonday()
  const isCurrent = weekStart === todayMonday

  function navigate(direction: -1 | 1) {
    const next = shiftWeek(weekStart, direction)
    router.push(`/stempeln?week=${next}`)
  }

  function goToday() {
    router.push("/stempeln")
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Button variant="outline" size="sm" className="rounded-lg h-9 w-9 p-0" onClick={() => navigate(-1)} aria-label="Vorherige Woche">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 min-w-0">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground whitespace-nowrap">
            KW {kw} — {label}
          </p>
          {isCurrent && (
            <p className="text-xs text-success font-medium">Aktuelle Woche</p>
          )}
        </div>
      </div>
      <Button variant="outline" size="sm" className="rounded-lg h-9 w-9 p-0" onClick={() => navigate(1)} aria-label="Naechste Woche">
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isCurrent && (
        <Button variant="outline" size="sm" className="rounded-lg h-9 text-xs font-medium" onClick={goToday}>
          Heute
        </Button>
      )}
    </div>
  )
}
