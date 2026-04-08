"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { SiteOverview } from "@/components/modules/sites/site-overview"
import { SiteForm } from "@/components/modules/sites/site-form"
import { SiteCostsTab } from "@/components/modules/sites/site-costs"
import { SiteNachkalkulation } from "@/components/modules/sites/site-nachkalkulation"
import { SiteTeam as SiteTeamComp } from "@/components/modules/sites/site-team"
import { SiteMeasurements as SiteMeasurementsComp } from "@/components/modules/sites/site-measurements"
import { SiteDetailTabs } from "@/components/modules/sites/site-detail-tabs"
import { formatDate } from "@/lib/utils/format"
import { getSiteStatusConfig } from "@/lib/utils/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Package, FileText, HardHat } from "lucide-react"
import type { Site, SiteStats, SiteForeman, SiteTimeEntry } from "@/lib/actions/sites"

interface SiteDetailProps {
  site: Site
  stats: SiteStats
  foremanList: SiteForeman[]
  timeEntries: SiteTimeEntry[]
  activeTab: string
  budgetUsed: number
}

export function SiteDetail({ site, stats, foremanList, timeEntries, activeTab, budgetUsed }: SiteDetailProps) {
  const statusConfig = getSiteStatusConfig(site.status)

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Baustellen", href: "/baustellen" }, { label: site.name }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold font-heading text-foreground">{site.name}</h1>
          {site.address && <p className="text-sm text-muted-foreground mt-1">{site.address}</p>}
        </div>
        <StatusBadge label={statusConfig.label} variant={statusConfig.variant} />
      </div>

      <SiteDetailTabs activeTab={activeTab}>
        {{
          uebersicht: <SiteOverview site={site} stats={stats} budgetUsed={budgetUsed} />,
          kosten: <SiteCostsTab siteId={site.id} />,
          zeiterfassung: (
            <div className="space-y-4">
              {timeEntries.length === 0 ? (
                <EmptyState icon={Clock} title="Keine Zeiteintraege" description="Fuer diese Baustelle wurden noch keine Arbeitszeiten erfasst." />
              ) : (
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader><CardTitle className="text-base font-semibold text-foreground">Zeiterfassung ({timeEntries.length} Eintraege)</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-xl border border-border overflow-hidden mx-6 mb-6">
                      <Table>
                        <TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Mitarbeiter</TableHead><TableHead>Datum</TableHead><TableHead>Beginn</TableHead><TableHead>Ende</TableHead><TableHead>Pause</TableHead><TableHead className="text-right">Stunden</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {timeEntries.map((entry) => (
                            <TableRow key={entry.id} className="hover:bg-muted/50 even:bg-muted/30">
                              <TableCell className="font-medium">{entry.user_name}</TableCell>
                              <TableCell>{formatDate(entry.date)}</TableCell>
                              <TableCell>{new Date(entry.clock_in).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                              <TableCell>{entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : <span className="text-success font-medium text-xs">Aktiv</span>}</TableCell>
                              <TableCell>{entry.break_minutes} Min.</TableCell>
                              <TableCell className="text-right font-mono">{entry.total_hours > 0 ? `${entry.total_hours} Std.` : "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ),
          nachkalkulation: <SiteNachkalkulation siteId={site.id} />,
          aufmass: <SiteMeasurementsComp siteId={site.id} />,
          team: <SiteTeamComp siteId={site.id} />,
          bautagesbericht: <EmptyState icon={FileText} title="Bautagesberichte" description="Berichte fuer diese Baustelle finden Sie im Bautagesbericht-Modul." />,
          fuhrpark: <EmptyState icon={HardHat} title="Fuhrpark-Zuweisungen" description="Geraete und Fahrzeuge koennen dieser Baustelle ueber den Fuhrpark zugewiesen werden." />,
          material: <EmptyState icon={Package} title="Material" description="Materialentnahmen fuer diese Baustelle werden im Lager-Modul erfasst." />,
          bearbeiten: <SiteForm mode="edit" site={site} foremanList={foremanList} />,
        }}
      </SiteDetailTabs>
    </div>
  )
}
