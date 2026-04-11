"use client"

import Link from "next/link"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Cog, CheckCircle2, Wrench, AlertTriangle, Plus } from "lucide-react"
import { VEHICLE_STATUSES } from "@/lib/utils/constants"
import { formatCurrency } from "@/lib/utils/format"
import { TuvWarningBadge } from "@/components/modules/fleet/tuv-warning-badge"
import type { Equipment } from "@/lib/actions/fleet"
import type { Column } from "@/components/shared/data-table"

type EquipmentRow = Equipment & Record<string, unknown>

const columns: Column<EquipmentRow>[] = [
  {
    key: "name",
    header: "Bezeichnung",
    sortable: true,
    render: (item) => (
      <Link
        href={`/fuhrpark/maschinen/${item.id}`}
        className="font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {item.name}
      </Link>
    ),
  },
  {
    key: "category",
    header: "Typ",
    sortable: true,
    render: (item) => <span className="text-sm text-foreground">{item.category}</span>,
  },
  {
    key: "availability_status",
    header: "Status",
    render: (item) => {
      const status = item.availability_status ?? "available"
      const statusInfo =
        VEHICLE_STATUSES[status as keyof typeof VEHICLE_STATUSES] ?? VEHICLE_STATUSES.available
      return <StatusBadge variant={statusInfo.variant} label={statusInfo.label} />
    },
  },
  {
    key: "daily_rate",
    header: "Tagessatz",
    render: (item) =>
      item.daily_rate ? (
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(item.daily_rate)}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    key: "next_maintenance",
    header: "Wartung",
    render: (item) => <TuvWarningBadge nextInspection={item.next_maintenance} label="Wartung" compact />,
  },
]

interface EquipmentListProps {
  equipment: Equipment[]
  available: number
  inUse: number
  workshop: number
  maintenanceCount: number
}

export function EquipmentList({
  equipment,
  available,
  inUse,
  workshop,
  maintenanceCount,
}: EquipmentListProps) {
  const equipmentRows = equipment as EquipmentRow[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maschinen & Geräte"
        description="Alle Maschinen und Geräte im Überblick."
      >
        <Link href="/fuhrpark/maschinen/neu">
          <Button className="rounded-xl h-11 font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Maschine hinzufügen
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Gesamt" value={equipment.length} icon={Cog} />
        <StatCard
          title="Frei"
          value={available}
          context={`${inUse} im Einsatz`}
          icon={CheckCircle2}
        />
        <StatCard title="Werkstatt" value={workshop} icon={Wrench} />
        <StatCard
          title="Wartungswarnungen"
          value={maintenanceCount}
          context="Fällig in 30 Tagen"
          icon={AlertTriangle}
          className={maintenanceCount > 0 ? "border-l-4 border-l-warning" : ""}
        />
      </div>

      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={equipmentRows}
            searchKey="name"
            searchPlaceholder="Maschine suchen..."
            pageSize={15}
            emptyState={{
              icon: Cog,
              title: "Noch keine Maschinen",
              description: "Fügen Sie Ihre erste Maschine hinzu, um loszulegen.",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
