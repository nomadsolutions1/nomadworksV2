"use client"

import Link from "next/link"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Truck, Wrench, Cog, AlertTriangle, Plus } from "lucide-react"
import { VEHICLE_STATUSES, WORKSHOP_STATUSES } from "@/lib/utils/constants"
import { TuvWarningBadge } from "@/components/modules/fleet/tuv-warning-badge"
import type { Vehicle, Equipment, WorkshopEntry, FleetStats } from "@/lib/actions/fleet"

interface FleetOverviewProps {
  stats: FleetStats
  vehicles: Vehicle[]
  equipment: Equipment[]
  activeWorkshop: WorkshopEntry[]
}

export function FleetOverview({
  stats,
  vehicles,
  equipment,
  activeWorkshop,
}: FleetOverviewProps) {
  const totalWarnings = stats.tuevWarnings + stats.maintenanceWarnings

  return (
    <div className="space-y-6">
      <PageHeader title="Fuhrpark" description="Fahrzeuge, Maschinen und Werkstatt auf einen Blick.">
        <Link href="/fuhrpark/fahrzeuge/neu">
          <Button variant="outline" className="rounded-xl h-11 gap-2">
            <Truck className="h-4 w-4" />
            Fahrzeug
          </Button>
        </Link>
        <Link href="/fuhrpark/maschinen/neu">
          <Button variant="outline" className="rounded-xl h-11 gap-2">
            <Cog className="h-4 w-4" />
            Maschine
          </Button>
        </Link>
        <Link href="/fuhrpark/werkstatt/neu">
          <Button className="rounded-xl h-11 font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Werkstattauftrag
          </Button>
        </Link>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fahrzeuge"
          value={stats.totalVehicles}
          context={`${stats.availableVehicles} frei · ${stats.workshopVehicles} Werkstatt`}
          icon={Truck}
        />
        <StatCard
          title="Maschinen"
          value={stats.totalEquipment}
          context={`${stats.availableEquipment} frei`}
          icon={Cog}
        />
        <StatCard
          title="Werkstatt aktiv"
          value={stats.activeWorkshop}
          context="Eingegangen / In Reparatur"
          icon={Wrench}
        />
        <StatCard
          title="Warnungen"
          value={totalWarnings}
          context={`${stats.tuevWarnings} TÜV · ${stats.maintenanceWarnings} Wartung`}
          icon={AlertTriangle}
          className={totalWarnings > 0 ? "border-l-4 border-l-warning" : ""}
        />
      </div>

      <Tabs defaultValue="fahrzeuge">
        <TabsList className="rounded-xl">
          <TabsTrigger value="fahrzeuge" className="rounded-lg gap-2">
            <Truck className="h-4 w-4" />
            Fahrzeuge
            <Badge variant="secondary" className="ml-1 rounded-full text-xs px-1.5 py-0">
              {vehicles.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="maschinen" className="rounded-lg gap-2">
            <Cog className="h-4 w-4" />
            Maschinen
            <Badge variant="secondary" className="ml-1 rounded-full text-xs px-1.5 py-0">
              {equipment.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="werkstatt" className="rounded-lg gap-2">
            <Wrench className="h-4 w-4" />
            Werkstatt
            <Badge variant="secondary" className="ml-1 rounded-full text-xs px-1.5 py-0">
              {activeWorkshop.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Vehicles Tab */}
        <TabsContent value="fahrzeuge" className="mt-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Fahrzeuge</CardTitle>
              <Link href="/fuhrpark/fahrzeuge">
                <Button variant="ghost" size="sm" className="rounded-lg text-primary text-xs">
                  Alle anzeigen
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {vehicles.length === 0 ? (
                <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
                  Noch keine Fahrzeuge angelegt.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {vehicles.slice(0, 5).map((v) => {
                    const statusInfo =
                      VEHICLE_STATUSES[
                        (v.availability_status ?? "available") as keyof typeof VEHICLE_STATUSES
                      ] ?? VEHICLE_STATUSES.available
                    return (
                      <Link
                        key={v.id}
                        href={`/fuhrpark/fahrzeuge/${v.id}`}
                        className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-1.5">
                            <Truck className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {v.make} {v.model}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {v.license_plate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge variant={statusInfo.variant} label={statusInfo.label} />
                          <TuvWarningBadge nextInspection={v.next_inspection} compact />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="maschinen" className="mt-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Maschinen &amp; Geräte
              </CardTitle>
              <Link href="/fuhrpark/maschinen">
                <Button variant="ghost" size="sm" className="rounded-lg text-primary text-xs">
                  Alle anzeigen
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {equipment.length === 0 ? (
                <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
                  Noch keine Maschinen angelegt.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {equipment.slice(0, 5).map((e) => {
                    const statusInfo =
                      VEHICLE_STATUSES[
                        (e.availability_status ?? "available") as keyof typeof VEHICLE_STATUSES
                      ] ?? VEHICLE_STATUSES.available
                    return (
                      <Link
                        key={e.id}
                        href={`/fuhrpark/maschinen/${e.id}`}
                        className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-accent/10 p-1.5">
                            <Cog className="h-3.5 w-3.5 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{e.name}</p>
                            <p className="text-xs text-muted-foreground">{e.category}</p>
                          </div>
                        </div>
                        <StatusBadge variant={statusInfo.variant} label={statusInfo.label} />
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workshop Tab */}
        <TabsContent value="werkstatt" className="mt-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Aktive Werkstattaufträge
              </CardTitle>
              <Link href="/fuhrpark/werkstatt">
                <Button variant="ghost" size="sm" className="rounded-lg text-primary text-xs">
                  Alle anzeigen
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {activeWorkshop.length === 0 ? (
                <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
                  Keine aktiven Werkstattaufträge.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeWorkshop.slice(0, 5).map((w) => {
                    const statusInfo =
                      WORKSHOP_STATUSES[w.status as keyof typeof WORKSHOP_STATUSES] ??
                      WORKSHOP_STATUSES.received
                    return (
                      <div key={w.id} className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="rounded-lg bg-danger/10 p-1.5 shrink-0">
                            <Wrench className="h-3.5 w-3.5 text-danger" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {w.reason}
                            </p>
                            {w.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {w.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <StatusBadge variant={statusInfo.variant} label={statusInfo.label} />
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
