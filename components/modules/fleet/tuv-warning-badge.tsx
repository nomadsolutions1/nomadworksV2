import { AlertTriangle } from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatDate } from "@/lib/utils/format"

interface TuvWarningBadgeProps {
  nextInspection: string | null
  /** Label-Präfix, z.B. "TÜV" (Fahrzeuge) oder "Wartung" (Maschinen). */
  label?: string
  /** Kurzform zeigt nur das Datum, Langform auch den Präfix. */
  compact?: boolean
}

/**
 * Reusable TÜV/Wartungs-Warning.
 *
 * Farblogik (Marcus V3-4):
 *   - überfällig  → danger
 *   - < 7 Tage    → danger
 *   - < 30 Tage   → warning
 *   - sonst       → neutral (Datum in muted color, keine Badge)
 */
export function TuvWarningBadge({
  nextInspection,
  label = "TÜV",
  compact = false,
}: TuvWarningBadgeProps) {
  if (!nextInspection) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const inspection = new Date(nextInspection)
  const diffDays = Math.floor((inspection.getTime() - today.getTime()) / 86400000)

  const isOverdue = diffDays < 0
  const isCritical = diffDays >= 0 && diffDays <= 7
  const isWarning = diffDays > 7 && diffDays <= 30

  const dateText = formatDate(nextInspection)
  const text = compact ? dateText : `${label} ${dateText}`

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-danger">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="font-mono">{text}</span>
        {!compact && <span>· überfällig</span>}
      </span>
    )
  }

  if (isCritical) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-danger">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="font-mono">{text}</span>
      </span>
    )
  }

  if (isWarning) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-warning">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="font-mono">{text}</span>
      </span>
    )
  }

  return <span className="text-sm font-mono text-muted-foreground">{text}</span>
}

/**
 * Inline warning banner for detail pages.
 * Uses StatusBadge internally for consistency.
 */
export function TuvWarningBanner({
  nextInspection,
  label = "TÜV",
}: {
  nextInspection: string | null
  label?: string
}) {
  if (!nextInspection) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const inspection = new Date(nextInspection)
  const diffDays = Math.floor((inspection.getTime() - today.getTime()) / 86400000)

  if (diffDays > 30) return null

  const isOverdue = diffDays < 0
  const isCritical = diffDays >= 0 && diffDays <= 7
  const variant: "danger" | "warning" = isOverdue || isCritical ? "danger" : "warning"
  const bgClass =
    variant === "danger" ? "bg-danger/5 border-danger/20" : "bg-warning/5 border-warning/20"
  const iconClass = variant === "danger" ? "text-danger" : "text-warning"
  const textClass = variant === "danger" ? "text-danger" : "text-warning"

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${bgClass}`}>
      <AlertTriangle className={`h-5 w-5 shrink-0 ${iconClass}`} />
      <div className="flex items-center gap-3 flex-wrap">
        <p className={`text-sm font-semibold ${textClass}`}>
          {label}-Termin am {formatDate(nextInspection)}
        </p>
        <StatusBadge
          variant={variant}
          label={
            isOverdue
              ? `${Math.abs(diffDays)} Tage überfällig`
              : diffDays === 0
                ? "Heute fällig"
                : `In ${diffDays} Tagen fällig`
          }
        />
      </div>
    </div>
  )
}
