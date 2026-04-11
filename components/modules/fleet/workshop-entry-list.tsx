"use client"

import Link from "next/link"
import { useTransition } from "react"
import { toast } from "sonner"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Wrench,
  Clock,
  CheckCircle2,
  Plus,
  Calendar,
  DollarSign,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { WORKSHOP_STATUSES } from "@/lib/utils/constants"
import { updateWorkshopEntry } from "@/lib/actions/fleet"
import type { WorkshopEntry } from "@/lib/actions/fleet"

interface WorkshopEntryListProps {
  entries: WorkshopEntry[]
  vehicleMap: Record<string, string>
  equipmentMap: Record<string, string>
  stats: {
    active: number
    inRepair: number
    done: number
    monthlyTotal: number
  }
  activeEntries: WorkshopEntry[]
  completedEntries: WorkshopEntry[]
}

export function WorkshopEntryList({
  vehicleMap,
  equipmentMap,
  stats,
  activeEntries,
  completedEntries,
}: WorkshopEntryListProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Werkstatt"
        description="Werkstattaufenthalte und Reparaturen verfolgen."
      >
        <Link href="/fuhrpark/werkstatt/neu">
          <Button className="rounded-xl h-11 font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Werkstattauftrag
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Aktiv"
          value={stats.active}
          context="Eingegangen / In Reparatur"
          icon={Wrench}
        />
        <StatCard title="In Reparatur" value={stats.inRepair} icon={Clock} />
        <StatCard
          title="Fertig"
          value={stats.done}
          context="Noch nicht abgeholt"
          icon={CheckCircle2}
        />
        <StatCard
          title="Kosten (Monat)"
          value={formatCurrency(stats.monthlyTotal)}
          icon={Wrench}
        />
      </div>

      {/* Active entries */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Aktive Aufträge ({activeEntries.length})
        </h2>
        {activeEntries.length === 0 ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="rounded-2xl bg-muted p-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <p className="font-semibold text-foreground">Keine aktiven Werkstattaufträge</p>
                <p className="text-sm text-muted-foreground">
                  Alle Fahrzeuge und Maschinen sind einsatzbereit.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeEntries.map((entry) => (
              <WorkshopEntryCard
                key={entry.id}
                entry={entry}
                assetName={
                  entry.entity_type === "vehicle"
                    ? (vehicleMap[entry.entity_id] ?? "Unbekannt")
                    : (equipmentMap[entry.entity_id] ?? "Unbekannt")
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed entries */}
      {completedEntries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Abgeschlossene Aufträge ({completedEntries.length})
          </h2>
          <div className="space-y-3">
            {completedEntries.slice(0, 10).map((entry) => (
              <WorkshopEntryCard
                key={entry.id}
                entry={entry}
                assetName={
                  entry.entity_type === "vehicle"
                    ? (vehicleMap[entry.entity_id] ?? "Unbekannt")
                    : (equipmentMap[entry.entity_id] ?? "Unbekannt")
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Single entry card with status flow ──────────────────────

const STATUS_FLOW: Array<{ from: string; to: string; label: string }> = [
  { from: "received", to: "in_repair", label: "Reparatur starten" },
  { from: "in_repair", to: "done", label: "Als fertig markieren" },
  { from: "done", to: "picked_up", label: "Als abgeholt markieren" },
]

function WorkshopEntryCard({ entry, assetName }: { entry: WorkshopEntry; assetName: string }) {
  const [isPending, startTransition] = useTransition()

  const statusInfo =
    WORKSHOP_STATUSES[entry.status as keyof typeof WORKSHOP_STATUSES] ?? WORKSHOP_STATUSES.received
  const totalCost =
    (entry.cost_parts ?? 0) + (entry.cost_labor ?? 0) + (entry.cost_external ?? 0)
  const nextAction = STATUS_FLOW.find((s) => s.from === entry.status)

  function handleStatusChange() {
    if (!nextAction) return
    startTransition(async () => {
      const result = await updateWorkshopEntry(entry.id, nextAction.to)
      if (result?.error) toast.error(result.error)
      else toast.success("Status aktualisiert")
    })
  }

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="rounded-xl bg-warning/10 p-2.5 mt-0.5 shrink-0">
              <Wrench className="h-4 w-4 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground truncate">{assetName}</span>
                <StatusBadge variant={statusInfo.variant} label={statusInfo.label} />
              </div>
              <p className="text-sm text-foreground mt-1 font-medium">{entry.reason}</p>
              {entry.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {entry.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Eingang: {formatDate(entry.entered_at)}</span>
                </div>
                {entry.completed_at && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Fertig: {formatDate(entry.completed_at)}</span>
                  </div>
                )}
                {totalCost > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                )}
              </div>

              {(entry.cost_parts || entry.cost_labor || entry.cost_external) && (
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {entry.cost_parts && entry.cost_parts > 0 && (
                    <span>Teile: {formatCurrency(entry.cost_parts)}</span>
                  )}
                  {entry.cost_labor && entry.cost_labor > 0 && (
                    <span>Arbeit: {formatCurrency(entry.cost_labor)}</span>
                  )}
                  {entry.cost_external && entry.cost_external > 0 && (
                    <span>Extern: {formatCurrency(entry.cost_external)}</span>
                  )}
                </div>
              )}

              {entry.notes && (
                <p className="text-xs text-muted-foreground mt-2 italic">{entry.notes}</p>
              )}
            </div>
          </div>

          {nextAction && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl shrink-0 text-xs font-semibold"
              onClick={handleStatusChange}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  {nextAction.label}
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
