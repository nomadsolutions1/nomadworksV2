"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { StatusBadge } from "@/components/shared/status-badge"
import { EquipmentForm } from "@/components/modules/fleet/equipment-form"
import { TuvWarningBanner } from "@/components/modules/fleet/tuv-warning-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VEHICLE_STATUSES } from "@/lib/utils/constants"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import type { Equipment } from "@/lib/actions/fleet"

interface EquipmentDetailProps {
  equipment: Equipment
}

export function EquipmentDetail({ equipment }: EquipmentDetailProps) {
  const e = equipment
  const statusInfo =
    VEHICLE_STATUSES[(e.availability_status ?? "available") as keyof typeof VEHICLE_STATUSES] ??
    VEHICLE_STATUSES.available

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Fuhrpark", href: "/fuhrpark" },
          { label: "Maschinen", href: "/fuhrpark/maschinen" },
          { label: e.name },
        ]}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold font-heading text-foreground">{e.name}</h1>
            <StatusBadge variant={statusInfo.variant} label={statusInfo.label} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {e.category}
            {e.serial_number && <span className="font-mono"> · {e.serial_number}</span>}
          </p>
        </div>
      </div>

      <TuvWarningBanner nextInspection={e.next_maintenance} label="Wartung" />

      {(e.purchase_price || e.daily_rate) && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Kosten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {e.purchase_price && (
              <Row label="Anschaffungspreis" value={formatCurrency(e.purchase_price)} />
            )}
            {e.purchase_date && <Row label="Kaufdatum" value={formatDate(e.purchase_date)} />}
            {e.daily_rate && (
              <Row
                label="Interner Tagessatz"
                value={formatCurrency(e.daily_rate)}
                emphasize
              />
            )}
          </CardContent>
        </Card>
      )}

      <EquipmentForm equipment={equipment} mode="edit" />
    </div>
  )
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-foreground">{label}</span>
      <span className={emphasize ? "font-semibold text-primary" : "font-semibold"}>{value}</span>
    </div>
  )
}
