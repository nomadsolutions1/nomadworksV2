"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { DiaryForm } from "./diary-form"
import { formatDate } from "@/lib/utils/format"
import type { DiaryEntry } from "@/lib/actions/diary"

interface DiaryEditProps {
  entry: DiaryEntry
  sites: Array<{ id: string; name: string }>
}

export function DiaryEdit({ entry, sites }: DiaryEditProps) {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Bautagesbericht", href: "/bautagesbericht" },
          { label: formatDate(entry.entry_date), href: `/bautagesbericht/${entry.id}` },
          { label: "Bearbeiten" },
        ]}
      />
      <PageHeader
        title="Bericht bearbeiten"
        description={`${entry.site_name ?? ""} · ${formatDate(entry.entry_date)}`}
      />
      <DiaryForm mode="edit" entry={entry} sites={sites} />
    </div>
  )
}
