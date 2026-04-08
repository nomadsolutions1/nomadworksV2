"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  getISOWeekNumber,
  shiftWeek,
  getCurrentMonday,
  formatFullDate,
  getWeekDateStrings,
} from "@/lib/utils/dates"

interface WeekNavigatorProps {
  weekStart: string
  basePath?: string
}

export function WeekNavigator({ weekStart, basePath = "/disposition" }: WeekNavigatorProps) {
  const router = useRouter()

  const weekDates = getWeekDateStrings(weekStart)
  const mondayDate = new Date(weekDates[0] + "T12:00:00")
  const sundayStr = weekDates[6]
  const kw = getISOWeekNumber(mondayDate)
  const label = `${formatFullDate(weekStart)} – ${formatFullDate(sundayStr)}`
  const todayMonday = getCurrentMonday()
  const isCurrent = weekStart === todayMonday

  function navigate(weeks: number) {
    const next = shiftWeek(weekStart, weeks)
    router.push(`${basePath}?week=${next}`)
  }

  function goToday() {
    router.push(`${basePath}?week=${todayMonday}`)
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg"
        onClick={() => navigate(-1)}
        aria-label="Vorherige Woche"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-foreground min-w-[220px] text-center">
        KW {kw} — {label}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg"
        onClick={() => navigate(1)}
        aria-label="Naechste Woche"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isCurrent && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg ml-2 text-xs"
          onClick={goToday}
        >
          Heute
        </Button>
      )}
    </div>
  )
}
