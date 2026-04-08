"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { DocumentUpload } from "./document-upload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatDateTime } from "@/lib/utils/format"
import { WEATHER_OPTIONS } from "@/lib/utils/constants"
import Link from "next/link"
import {
  Calendar, MapPin, Pencil, Thermometer, Wind, AlertTriangle, Wrench, FileText,
} from "lucide-react"
import type { DiaryEntry, DiaryDocument } from "@/lib/actions/diary"

interface DiaryDetailProps {
  entry: DiaryEntry
  documents: DiaryDocument[]
}

function getWeatherOption(label: string | null) {
  if (!label) return null
  return WEATHER_OPTIONS.find((o) => o.label === label) ?? null
}

export function DiaryDetail({ entry, documents }: DiaryDetailProps) {
  const weatherOpt = getWeatherOption(entry.weather)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Bautagesbericht", href: "/bautagesbericht" },
          { label: formatDate(entry.entry_date) },
        ]}
      />
      <PageHeader
        title={`Bautagesbericht – ${formatDate(entry.entry_date)}`}
        description={entry.site_name ?? undefined}
      >
        <Link href={`/bautagesbericht/${entry.id}/bearbeiten`}>
          <Button variant="outline" className="rounded-xl h-11 gap-2">
            <Pencil className="h-4 w-4" />
            Bearbeiten
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {entry.work_description && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Durchgeführte Arbeiten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {entry.work_description}
                </p>
              </CardContent>
            </Card>
          )}
          {(entry.incidents || entry.defects) && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                  Vorkommnisse &amp; Probleme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {entry.incidents && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-semibold text-destructive">Vorkommnisse</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.incidents}</p>
                  </div>
                )}
                {entry.defects && (
                  <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="h-4 w-4 text-warning" />
                      <span className="text-sm font-semibold text-warning">Mängel</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.defects}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {entry.notes && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Sonstige Bemerkungen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{entry.notes}</p>
              </CardContent>
            </Card>
          )}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Dokumente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUpload entryId={entry.id} documents={documents} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Datum
                </span>
                <span className="text-sm font-medium text-foreground">{formatDate(entry.entry_date)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Baustelle
                </span>
                <span className="text-sm font-medium text-foreground">{entry.site_name || "---"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-xs text-muted-foreground">Erstellt von</span>
                <span className="text-sm font-medium text-foreground">{entry.created_by_name || "---"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-muted-foreground">Erstellt am</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Wetter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weatherOpt ? (
                <div className="flex items-center gap-3 py-2">
                  <span className="text-3xl">{weatherOpt.icon}</span>
                  <span className="text-sm font-semibold text-foreground">{weatherOpt.label}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Wetterangabe</p>
              )}
              {entry.temperature != null && (
                <div className="flex items-center justify-between py-2 border-t">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Thermometer className="h-3.5 w-3.5" /> Temperatur
                  </span>
                  <span className="text-sm font-semibold text-foreground">{entry.temperature} °C</span>
                </div>
              )}
              {entry.wind && (
                <div className="flex items-center justify-between py-2 border-t">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Wind className="h-3.5 w-3.5" /> Wind
                  </span>
                  <span className="text-sm font-medium text-foreground">{entry.wind}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
