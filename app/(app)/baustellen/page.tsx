import { getSites } from "@/lib/actions/sites"
import { SiteList } from "@/components/modules/sites/site-list"
import { TipsBanner } from "@/components/shared/tips-banner"
import type { Metadata } from "next"
import type { Site } from "@/lib/actions/sites"

export const metadata: Metadata = { title: "Baustellen" }

export default async function BaustellenPage() {
  const { data: sites = [] } = await getSites()

  const totalSites = sites.length
  const activeSites = sites.filter((s) => s.status === "active").length
  const pausedSites = sites.filter((s) => s.status === "paused").length
  const totalBudget = sites.reduce((sum, s) => sum + (s.budget ?? 0), 0)

  const tableData = (sites as Site[]).map((s) => ({ ...s } as Record<string, unknown>))

  return (
    <>
      <TipsBanner module="baustellen" />
      <SiteList
        sites={tableData}
        totalSites={totalSites}
        activeSites={activeSites}
        pausedSites={pausedSites}
        totalBudget={totalBudget}
      />
    </>
  )
}
