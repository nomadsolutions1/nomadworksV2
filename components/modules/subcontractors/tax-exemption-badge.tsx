import { StatusBadge } from "@/components/shared/status-badge"
import { CheckCircle2, AlertTriangle, Circle } from "lucide-react"

export type TaxExemptionStatus = "valid" | "expiring" | "expired" | "missing"

export function getTaxExemptionStatus(
  validUntil: string | null | undefined
): TaxExemptionStatus {
  if (!validUntil) return "missing"
  const today = new Date()
  const expiry = new Date(validUntil)
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return "expired"
  if (diffDays <= 30) return "expiring"
  return "valid"
}

interface TaxExemptionBadgeProps {
  validUntil: string | null | undefined
  showDate?: boolean
}

export function TaxExemptionBadge({ validUntil, showDate = false }: TaxExemptionBadgeProps) {
  const status = getTaxExemptionStatus(validUntil)

  if (status === "missing") {
    return <StatusBadge label="Nicht hinterlegt" variant="neutral" />
  }

  const dateLabel = validUntil
    ? new Date(validUntil).toLocaleDateString("de-DE")
    : ""

  if (status === "expired") {
    return (
      <StatusBadge
        label={showDate ? `Abgelaufen (${dateLabel})` : "Abgelaufen"}
        variant="danger"
      />
    )
  }

  if (status === "expiring") {
    return (
      <StatusBadge
        label={showDate ? `Läuft ab: ${dateLabel}` : "Läuft bald ab"}
        variant="warning"
      />
    )
  }

  return (
    <StatusBadge
      label={showDate ? `Gültig bis ${dateLabel}` : "Gültig"}
      variant="success"
    />
  )
}

export function TaxExemptionIcon({ status }: { status: TaxExemptionStatus }) {
  if (status === "valid") return <CheckCircle2 className="h-4 w-4 text-success" />
  if (status === "expiring") return <AlertTriangle className="h-4 w-4 text-warning" />
  if (status === "expired") return <AlertTriangle className="h-4 w-4 text-danger" />
  return <Circle className="h-4 w-4 text-muted-foreground" />
}
