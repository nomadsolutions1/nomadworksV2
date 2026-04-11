"use client"

import Link from "next/link"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Truck, CheckCircle2, Wrench, AlertTriangle, Plus } from "lucide-react"
import { VEHICLE_STATUSES, VEHICLE_TYPE_LABELS } from "@/lib/utils/constants"
import { formatNumber } from "@/lib/utils/format"
import { TuvWarningBadge } from "@/components/modules/fleet/tuv-warning-badge"
import type { Vehicle } from "@/lib/actions/fleet"
import type { Column } from "@/components/shared/data-table"

type VehicleRow = Vehicle & Record<string, unknown>

const columns: Column<VehicleRow>[] = [
  {
    key: "license_plate",
    header: "Kennzeichen",
    sortable: true,
    render: (item) => (
      <Link
        href={`/fuhrpark/fahrzeuge/${item.id}`}
        className="font-mono font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {item.license_plate}
      </Link>
    ),
  },
  {
    key: "make",
    header: "Fahrzeug",
    sortable: true,
    render: (item) => (
      <span className="text-sm font-medium text-foreground">
        {item.make} {item.model}
        {item.year && <span className="text-muted-foreground font-normal ml-1">({item.year})</span>}
      </span>
    ),
  },
  {
    key: "type",
    header: "Typ",
    render: (item) => (
      <span className="text-sm text-foreground">
        {VEHICLE_TYPE_LABELS[item.type as keyof typeof VEHICLE_TYPE_LABELS] ?? item.type}
      </span>
    ),
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
    key: "next_inspection",
    header: "TÜV",
    render: (item) => <TuvWarningBadge nextInspection={item.next_inspection} compact />,
  },
  {
    key: "mileage",
    header: "km-Stand",
    render: (item) =>
      item.mileage ? (
        <span className="text-sm font-mono text-foreground">
          {formatNumber(item.mileage)} km
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
]

interface VehicleListProps {
  vehicles: Vehicle[]
  available: number
  inUse: number
  workshop: number
  tuevCount: number
}

export function VehicleList({
  vehicles,
  available,
  inUse,
  workshop,
  tuevCount,
}: VehicleListProps) {
  const vehicleRows = vehicles as VehicleRow[]

  return (
    <div className="space-y-6">
      <PageHeader title="Fahrzeuge" description="Verwalten Sie Ihren Fuhrpark.">
        <Link href="/fuhrpark/fahrzeuge/neu">
          <Button className="rounded-xl h-11 font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Fahrzeug hinzufügen
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Gesamt" value={vehicles.length} icon={Truck} />
        <StatCard
          title="Frei"
          value={available}
          context={`${inUse} im Einsatz`}
          icon={CheckCircle2}
        />
        <StatCard title="Werkstatt" value={workshop} icon={Wrench} />
        <StatCard
          title="TÜV-Warnungen"
          value={tuevCount}
          context="Fällig in 30 Tagen"
          icon={AlertTriangle}
          className={tuevCount > 0 ? "border-l-4 border-l-warning" : ""}
        />
      </div>

      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={vehicleRows}
            searchKey="license_plate"
            searchPlaceholder="Kennzeichen suchen..."
            pageSize={15}
            emptyState={{
              icon: Truck,
              title: "Noch keine Fahrzeuge",
              description: "Fügen Sie Ihr erstes Fahrzeug hinzu, um loszulegen.",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
