"use client"

import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/utils/format"
import { getSiteStatusConfig } from "@/lib/utils/constants"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MapPin, CheckCircle2, PauseCircle, Euro, Plus, Map } from "lucide-react"
import type { Column } from "@/components/shared/data-table"

type SiteRow = Record<string, unknown>

interface SiteListProps {
  sites: SiteRow[]
  totalSites: number
  activeSites: number
  pausedSites: number
  totalBudget: number
}

const columns: Column<SiteRow>[] = [
  { key: "name", header: "Name", sortable: true, render: (row) => <Link href={`/baustellen/${row.id as string}`} className="font-medium text-foreground hover:text-primary transition-colors">{row.name as string}</Link> },
  { key: "address", header: "Adresse", render: (row) => <span className="text-muted-foreground">{(row.address as string) || "—"}</span> },
  { key: "status", header: "Status", sortable: true, render: (row) => { const cfg = getSiteStatusConfig(row.status as string); return <StatusBadge label={cfg.label} variant={cfg.variant} /> } },
  { key: "budget", header: "Budget", sortable: true, render: (row) => <span className="font-mono text-sm">{row.budget != null ? formatCurrency(row.budget as number) : "—"}</span> },
  { key: "site_manager_name", header: "Bauleiter", render: (row) => <span className="text-muted-foreground">{(row.site_manager_name as string) || "—"}</span> },
]

export function SiteList({ sites, totalSites, activeSites, pausedSites, totalBudget }: SiteListProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader title="Baustellen" description="Alle Baustellen und deren Status im Ueberblick.">
        <Link href="/baustellen/karte"><Button variant="outline" className="rounded-xl h-11 gap-2"><Map className="h-4 w-4" /> Kartenansicht</Button></Link>
        <Link href="/baustellen/neu"><Button className="rounded-xl font-semibold h-11 gap-2"><Plus className="h-4 w-4" /> Baustelle anlegen</Button></Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Baustellen gesamt" value={totalSites} icon={MapPin} />
        <StatCard title="Aktiv" value={activeSites} icon={CheckCircle2} />
        <StatCard title="Pausiert" value={pausedSites} icon={PauseCircle} />
        <StatCard title="Budget gesamt" value={totalBudget > 0 ? formatCurrency(totalBudget) : "—"} context={totalSites > 0 ? `Ueber ${totalSites} Baustellen` : undefined} icon={Euro} />
      </div>

      {totalSites === 0 ? (
        <EmptyState icon={MapPin} title="Keine Baustellen vorhanden" description="Legen Sie Ihre erste Baustelle an." action={{ label: "Baustelle anlegen", onClick: () => router.push("/baustellen/neu") }} />
      ) : (
        <DataTable columns={columns} data={sites} searchKey="name" searchPlaceholder="Baustellen suchen..." pageSize={15} />
      )}
    </div>
  )
}
