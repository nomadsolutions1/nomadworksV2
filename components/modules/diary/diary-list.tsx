"use client"

import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { BautagesberichtFilters } from "./diary-filters"
import { formatDate } from "@/lib/utils/format"
import { WEATHER_OPTIONS } from "@/lib/utils/constants"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClipboardList, Calendar, MapPin, FileText, Plus, AlertTriangle } from "lucide-react"
import type { Column } from "@/components/shared/data-table"

type DiaryRow = Record<string, unknown>

function getWeatherIcon(label: string | null): string {
  if (!label) return "\u2014"
  const opt = WEATHER_OPTIONS.find((o) => o.label === label)
  return opt ? `${opt.icon} ${opt.label}` : label
}

function truncate(text: string | null, max = 40): string {
  if (!text) return "\u2014"
  return text.length > max ? text.slice(0, max) + "\u2026" : text
}

const columns: Column<DiaryRow>[] = [
  {
    key: "entry_date",
    header: "Datum",
    sortable: true,
    render: (row) => (
      <Link
        href={`/bautagesbericht/${row.id as string}`}
        className="font-medium text-foreground hover:text-primary transition-colors"
      >
        {formatDate(row.entry_date as string)}
      </Link>
    ),
  },
  {
    key: "site_name",
    header: "Baustelle",
    sortable: true,
    render: (row) => (
      <span className="text-muted-foreground">{(row.site_name as string) || "\u2014"}</span>
    ),
  },
  {
    key: "weather",
    header: "Wetter",
    render: (row) => (
      <span className="text-sm">{getWeatherIcon(row.weather as string | null)}</span>
    ),
  },
  {
    key: "incidents",
    header: "Vorkommnisse",
    render: (row) => {
      const incidents = row.incidents as string | null
      const defects = row.defects as string | null
      if (!incidents && !defects) {
        return (
          <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Keine
          </span>
        )
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {incidents && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive">
              <AlertTriangle className="h-3 w-3" />
              {truncate(incidents, 20)}
            </span>
          )}
          {defects && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning">
              Mangel
            </span>
          )}
        </div>
      )
    },
  },
  {
    key: "created_by_name",
    header: "Erstellt von",
    render: (row) => (
      <span className="text-sm text-muted-foreground">{row.created_by_name as string}</span>
    ),
  },
]

interface DiaryListProps {
  entries: DiaryRow[]
  stats: {
    monthCount: number
    todayCount: number
    sitesWithEntries: number
    documentCount: number
  }
  siteOptions: { id: string; name: string }[]
}

export function DiaryList({ entries, stats, siteOptions }: DiaryListProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bautagesbericht"
        description="Taegliche Baustellenberichte erstellen und verwalten."
      >
        <Link href="/bautagesbericht/neu">
          <Button className="rounded-xl font-semibold h-11 gap-2">
            <Plus className="h-4 w-4" />
            Bericht erstellen
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Berichte (Monat)" value={stats.monthCount} icon={ClipboardList} />
        <StatCard title="Heute" value={stats.todayCount} icon={Calendar} />
        <StatCard title="Baustellen mit Berichten" value={stats.sitesWithEntries} icon={MapPin} />
        <StatCard title="PDFs hochgeladen" value={stats.documentCount} icon={FileText} />
      </div>

      <BautagesberichtFilters sites={siteOptions} />

      {entries.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Keine Berichte vorhanden"
          description="Erstellen Sie den ersten Bautagesbericht für Ihre Baustellen."
        />
      ) : (
        <DataTable
          columns={columns}
          data={entries}
          searchKey="site_name"
          searchPlaceholder="Baustelle suchen..."
          pageSize={15}
        />
      )}
    </div>
  )
}
