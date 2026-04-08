import { MapPin, Clock } from "lucide-react"
import { formatDate, formatHours } from "@/lib/utils/format"
import type { TimeEntry } from "@/lib/actions/time-entries"
import type { SurchargeType } from "@/lib/utils/dates"

interface TimeEntryRowProps {
  entry: TimeEntry
  showEmployee?: boolean
}

function SurchargeBadge({ surcharge }: { surcharge: SurchargeType }) {
  if (!surcharge) return null

  const config: Record<string, { label: string; icon: string }> = {
    night: { label: "Nacht", icon: "\uD83C\uDF19" },
    weekend: { label: "Wochenende", icon: "\uD83D\uDCC5" },
    holiday: { label: "Feiertag", icon: "\uD83C\uDF84" },
  }

  const c = config[surcharge]
  if (!c) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary">
      {c.icon} {c.label}
    </span>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function TimeEntryRow({ entry, showEmployee = false }: TimeEntryRowProps) {
  const netHours = entry.total_minutes > 0 ? formatHours(entry.total_minutes) : "\u2014"

  return (
    <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 hover:bg-muted/80 transition-colors">
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {showEmployee && (
            <span className="text-sm font-semibold text-foreground">{entry.user_name}</span>
          )}
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{entry.site_name}</span>
          </div>
          <SurchargeBadge surcharge={entry.surcharge} />
          {entry.edited_at && (
            <span className="text-[10px] text-muted-foreground italic">bearbeitet</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatDate(entry.clock_in)}</span>
          <span className="flex items-center gap-1 font-mono">
            <Clock className="h-3 w-3" />
            {formatTime(entry.clock_in)}
            {" \u2013 "}
            {entry.clock_out ? (
              formatTime(entry.clock_out)
            ) : (
              <span className="text-success font-semibold">läuft</span>
            )}
          </span>
          {entry.break_minutes > 0 && (
            <span>{entry.break_minutes} Min. Pause</span>
          )}
        </div>
        {entry.notes && (
          <p className="text-xs text-muted-foreground italic truncate max-w-xs">{entry.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <span className="text-sm font-semibold font-mono tabular-nums text-foreground">
          {netHours}
        </span>
      </div>
    </div>
  )
}
