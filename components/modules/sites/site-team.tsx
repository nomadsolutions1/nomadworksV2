"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getSiteTeam } from "@/lib/actions/sites"
import { formatCurrency } from "@/lib/utils/format"

export type SiteTeamMember = {
  userId: string
  name: string
  jobTitle: string | null
  totalHours: number
  totalCosts: number
}

interface SiteTeamProps { siteId: string }

export function SiteTeam({ siteId }: SiteTeamProps) {
  const [team, setTeam] = useState<SiteTeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getSiteTeam(siteId).then(({ data }) => { setTeam(data ?? []); setLoading(false) }) }, [siteId])

  if (loading) return <Skeleton className="h-48 rounded-2xl" />

  const totalHours = team.reduce((s, m) => s + m.totalHours, 0)
  const totalCosts = team.reduce((s, m) => s + m.totalCosts, 0)

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader><CardTitle className="text-base font-semibold">Team ({team.length} Mitarbeiter)</CardTitle></CardHeader>
      <CardContent>
        {team.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Noch keine Zeiteinträge für diese Baustelle.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="pb-2 font-medium">Mitarbeiter</th><th className="pb-2 font-medium">Bezeichnung</th><th className="pb-2 font-medium text-right">Stunden</th><th className="pb-2 font-medium text-right">Kosten</th></tr></thead>
              <tbody className="divide-y divide-border">
                {team.map((m) => (<tr key={m.userId}><td className="py-2 font-medium">{m.name}</td><td className="py-2 text-muted-foreground">{m.jobTitle || "—"}</td><td className="py-2 text-right font-mono">{m.totalHours.toFixed(1)} h</td><td className="py-2 text-right font-mono">{formatCurrency(m.totalCosts)}</td></tr>))}
                <tr className="font-semibold border-t-2 border-foreground/20"><td className="pt-3" colSpan={2}>Gesamt</td><td className="pt-3 text-right font-mono">{totalHours.toFixed(1)} h</td><td className="pt-3 text-right font-mono">{formatCurrency(totalCosts)}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
