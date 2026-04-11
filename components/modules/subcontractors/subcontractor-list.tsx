"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { DataTable, type Column } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Handshake, CheckCircle2, AlertTriangle, Star, Plus } from "lucide-react"
import {
  TaxExemptionBadge,
  getTaxExemptionStatus,
} from "@/components/modules/subcontractors/tax-exemption-badge"
import { RatingDisplay } from "@/components/modules/subcontractors/rating-display"
import type { Subcontractor } from "@/lib/actions/subcontractors"

type SubRow = Subcontractor & Record<string, unknown>
type Filter = "all" | "active" | "warning"

function avgRating(
  q: number | null,
  r: number | null,
  p: number | null
): number | null {
  const vals = [q, r, p].filter((v): v is number => v !== null)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

interface SubcontractorListProps {
  subcontractors: Subcontractor[]
}

export function SubcontractorList({ subcontractors }: SubcontractorListProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")

  const stats = useMemo(() => {
    const total = subcontractors.length
    const valid48b = subcontractors.filter(
      (s) => getTaxExemptionStatus(s.tax_exemption_valid_until) === "valid"
    ).length
    const warning48b = subcontractors.filter((s) => {
      const st = getTaxExemptionStatus(s.tax_exemption_valid_until)
      return st === "expired" || st === "expiring"
    }).length

    const ratings = subcontractors
      .map((s) => avgRating(s.quality_rating, s.reliability_rating, s.price_rating))
      .filter((v): v is number => v !== null)
    const avgOverall =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null

    return { total, valid48b, warning48b, avgOverall }
  }, [subcontractors])

  const filtered = useMemo(() => {
    if (filter === "all") return subcontractors
    if (filter === "active") {
      return subcontractors.filter((s) => (s.active_assignments ?? 0) > 0)
    }
    // warning
    return subcontractors.filter((s) => {
      const st = getTaxExemptionStatus(s.tax_exemption_valid_until)
      return st === "expired" || st === "expiring"
    })
  }, [subcontractors, filter])

  const columns: Column<SubRow>[] = [
    {
      key: "name",
      header: "Firma",
      sortable: true,
      render: (row) => (
        <Link
          href={`/subunternehmer/${row.id}`}
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: "trade",
      header: "Gewerk",
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground">{row.trade || "—"}</span>
      ),
    },
    {
      key: "tax_exemption_valid_until",
      header: "§48b",
      render: (row) => <TaxExemptionBadge validUntil={row.tax_exemption_valid_until} showDate />,
    },
    {
      key: "quality_rating",
      header: "Bewertung",
      render: (row) => {
        const avg = avgRating(
          row.quality_rating,
          row.reliability_rating,
          row.price_rating
        )
        if (avg === null) return <span className="text-xs text-muted-foreground">—</span>
        return <RatingDisplay value={Math.round(avg)} size="sm" />
      },
    },
    {
      key: "active_assignments",
      header: "Aktive Einsätze",
      render: (row) => {
        const n = row.active_assignments ?? 0
        if (n === 0) return <span className="text-muted-foreground text-sm">0</span>
        return (
          <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold px-2">
            {n}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subunternehmer"
        description="Verwalten Sie Ihre Subunternehmer, §48b-Bescheinigungen und Einsätze."
      >
        <Link href="/subunternehmer/neu">
          <Button className="rounded-xl h-11 font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Subunternehmer hinzufügen
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Gesamt" value={stats.total} icon={Handshake} />
        <StatCard title="§48b gültig" value={stats.valid48b} icon={CheckCircle2} />
        <StatCard
          title="§48b Warnung"
          value={stats.warning48b}
          icon={AlertTriangle}
          className={stats.warning48b > 0 ? "border-warning/40" : undefined}
        />
        <StatCard
          title="Ø Bewertung"
          value={stats.avgOverall !== null ? `${stats.avgOverall.toFixed(1)} / 5` : "—"}
          icon={Star}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => setFilter("all")}
        >
          Alle ({stats.total})
        </Button>
        <Button
          variant={filter === "active" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => setFilter("active")}
        >
          Aktive Einsätze
        </Button>
        <Button
          variant={filter === "warning" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => setFilter("warning")}
        >
          §48b Warnung ({stats.warning48b})
        </Button>
      </div>

      {subcontractors.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Noch keine Subunternehmer"
          description="Erfassen Sie Ihren ersten Subunternehmer, um Einsätze und §48b-Bescheinigungen zu verfolgen."
          action={{
            label: "Subunternehmer hinzufügen",
            onClick: () => router.push("/subunternehmer/neu"),
          }}
        />
      ) : (
        <DataTable<SubRow>
          columns={columns}
          data={filtered as SubRow[]}
          searchKey="name"
          searchPlaceholder="Subunternehmer suchen..."
          pageSize={15}
        />
      )}
    </div>
  )
}
