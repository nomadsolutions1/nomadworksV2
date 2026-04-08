"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { DiaryForm } from "./diary-form"

interface DiaryNewProps {
  sites: Array<{ id: string; name: string }>
  defaultSiteId?: string
}

export function DiaryNew({ sites, defaultSiteId }: DiaryNewProps) {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Bautagesbericht", href: "/bautagesbericht" },
          { label: "Bericht erstellen" },
        ]}
      />
      <PageHeader
        title="Bautagesbericht erstellen"
        description="Erfassen Sie den Tagesbericht für eine Baustelle."
      />
      <DiaryForm mode="create" sites={sites} defaultSiteId={defaultSiteId} />
    </div>
  )
}
