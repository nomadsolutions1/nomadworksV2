"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { SiteForm } from "@/components/modules/sites/site-form"
import type { SiteForeman } from "@/lib/actions/sites"

interface OrderOption { id: string; title: string; budget: number | null }
interface SiteNewProps { foremanList: SiteForeman[]; orders?: OrderOption[] }

export function SiteNew({ foremanList, orders }: SiteNewProps) {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Baustellen", href: "/baustellen" }, { label: "Neue Baustelle" }]} />
      <PageHeader title="Baustelle anlegen" description="Erstellen Sie eine neue Baustelle für Ihr Unternehmen." />
      <SiteForm mode="create" foremanList={foremanList} orders={orders} />
    </div>
  )
}
