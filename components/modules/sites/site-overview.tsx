"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { getSiteStatusConfig } from "@/lib/utils/constants"
import type { Site, SiteStats } from "@/lib/actions/sites"
import { Calendar, Clock, Euro, User, Phone, Mail, Briefcase, ClipboardList, HardHat, StickyNote } from "lucide-react"

interface SiteOverviewProps {
  site: Site
  stats: SiteStats
  budgetUsed: number
}

export function SiteOverview({ site, stats, budgetUsed }: SiteOverviewProps) {
  const statusConfig = getSiteStatusConfig(site.status)

  const budgetPercent = site.budget && site.budget > 0
    ? Math.min(100, Math.round((budgetUsed / site.budget) * 100))
    : 0
  const budgetBarColor = budgetPercent > 90 ? "bg-danger" : budgetPercent > 70 ? "bg-warning" : "bg-success"

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Arbeitsstunden" value={`${stats.totalHours} Std.`} context={`${stats.timeEntriesCount} Einträge`} icon={Clock} />
        <StatCard title="Budget" value={site.budget ? formatCurrency(site.budget) : "—"} context={site.budget ? `${budgetPercent}% verbraucht` : "Kein Budget festgelegt"} icon={Euro} />
        <StatCard title="Bautagesberichte" value={stats.diaryEntriesCount} context="Berichte gesamt" icon={ClipboardList} />
        <StatCard title="Geräte" value={stats.equipmentCount} context="Zugewiesen" icon={HardHat} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold text-foreground">Baustellendaten</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Status</span><StatusBadge label={statusConfig.label} variant={statusConfig.variant} /></div>
            {site.start_date && <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Startdatum</span><span className="text-sm font-medium text-foreground">{formatDate(site.start_date)}</span></div>}
            {site.end_date && <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Enddatum</span><span className="text-sm font-medium text-foreground">{formatDate(site.end_date)}</span></div>}
            {site.site_manager_name && <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Bauleiter</span><span className="text-sm font-medium text-foreground">{site.site_manager_name}</span></div>}
            {site.address && <div className="flex items-start justify-between gap-4"><span className="text-sm text-muted-foreground shrink-0">Adresse</span><span className="text-sm font-medium text-foreground text-right">{site.address}</span></div>}
            {site.budget && site.budget > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Budgetauslastung</span><span className="font-medium text-foreground">{budgetPercent}%</span></div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${budgetBarColor}`} style={{ width: `${budgetPercent}%` }} /></div>
                <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{formatCurrency(budgetUsed)} verbraucht</span><span>{formatCurrency(site.budget)} gesamt</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {(site.client_name || site.client_phone || site.client_email) && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="text-base font-semibold text-foreground flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Auftraggeber</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {site.client_name && <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground shrink-0" /><span className="text-sm font-medium text-foreground">{site.client_name}</span></div>}
                {site.client_phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground shrink-0" /><a href={`tel:${site.client_phone}`} className="text-sm text-primary hover:underline">{site.client_phone}</a></div>}
                {site.client_email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /><a href={`mailto:${site.client_email}`} className="text-sm text-primary hover:underline">{site.client_email}</a></div>}
              </CardContent>
            </Card>
          )}
          {(site.contact_name || site.contact_phone) && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="text-base font-semibold text-foreground flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Ansprechpartner vor Ort</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {site.contact_name && <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground shrink-0" /><div><span className="text-sm font-medium text-foreground">{site.contact_name}</span>{site.contact_role && <span className="text-xs text-muted-foreground ml-2">({site.contact_role})</span>}</div></div>}
                {site.contact_phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground shrink-0" /><a href={`tel:${site.contact_phone}`} className="text-sm text-primary hover:underline">{site.contact_phone}</a></div>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {site.notes && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold text-foreground flex items-center gap-2"><StickyNote className="h-4 w-4 text-primary" /> Notizen</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{site.notes}</p></CardContent>
        </Card>
      )}
      {site.description && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold text-foreground">Beschreibung</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{site.description}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
