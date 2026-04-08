"use client"

import dynamic from "next/dynamic"
import { PageHeader } from "@/components/layout/page-header"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Site } from "@/lib/actions/sites"

const SiteMap = dynamic(() => import("@/components/modules/sites/site-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-2xl" />,
})

interface SiteMapPageProps {
  sites: Site[]
}

export function SiteMapPage({ sites }: SiteMapPageProps) {
  const activeSites = sites.filter((s) => s.status === "active")
  const pausedSites = sites.filter((s) => s.status === "paused")
  const sitesWithCoords = sites.filter((s) => s.latitude != null && s.longitude != null)

  return (
    <div className="flex flex-col h-full space-y-4">
      <Breadcrumbs items={[{ label: "Baustellen", href: "/baustellen" }, { label: "Kartenansicht" }]} />
      <PageHeader title="Baustellen — Karte" description="Geografische Uebersicht aller Baustellen.">
        <Link href="/baustellen"><Button variant="outline" className="rounded-xl h-11">Zur Liste</Button></Link>
      </PageHeader>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><span className="h-3 w-3 rounded-full bg-success" /> Aktiv ({activeSites.length})</div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><span className="h-3 w-3 rounded-full bg-warning" /> Pausiert ({pausedSites.length})</div>
        {sitesWithCoords.length < sites.length && (
          <Badge variant="outline" className="text-xs text-muted-foreground rounded-full">{sites.length - sitesWithCoords.length} Baustellen ohne Koordinaten</Badge>
        )}
      </div>

      <div className="flex-1 min-h-[500px] rounded-2xl overflow-hidden border shadow-sm">
        {sites.length > 0 ? <SiteMap sites={sites} /> : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-2xl bg-muted p-4 mb-4"><MapPin className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Keine Baustellen vorhanden</h3>
            <p className="text-sm text-muted-foreground mb-6">Legen Sie zunaechst Baustellen an.</p>
            <Link href="/baustellen/neu"><Button className="rounded-xl font-semibold">Baustelle anlegen</Button></Link>
          </div>
        )}
      </div>

      {sites.length > 0 && sitesWithCoords.length === 0 && (
        <div className="rounded-2xl bg-warning/10 border border-warning/30 p-4 mt-2">
          <p className="text-sm font-medium text-warning">Keine Baustellen mit Standortdaten vorhanden</p>
          <p className="text-xs text-muted-foreground mt-1">Die Karte zeigt nur Baustellen mit GPS-Koordinaten.</p>
        </div>
      )}
    </div>
  )
}
