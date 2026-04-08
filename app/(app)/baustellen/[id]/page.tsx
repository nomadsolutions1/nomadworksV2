import { notFound } from "next/navigation"
import { getSite, getSiteStats, getForemanList, getTimeEntriesForSite, getSiteCosts } from "@/lib/actions/sites"
import { SiteDetail } from "@/components/modules/sites/site-detail"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const { data: site } = await getSite(id)
  return { title: site?.name ?? "Baustelle" }
}

export default async function BaustelleDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab = "uebersicht" } = await searchParams

  const [siteResult, statsResult, foremanResult, timeResult, costsResult] = await Promise.all([
    getSite(id),
    getSiteStats(id),
    getForemanList(),
    getTimeEntriesForSite(id),
    getSiteCosts(id),
  ])

  if (!siteResult.data) notFound()

  // Calculate real budgetUsed from costs data
  const budgetUsed = costsResult.data?.totalCosts ?? 0

  return (
    <SiteDetail
      site={siteResult.data}
      stats={statsResult.data ?? {
        timeEntriesCount: 0,
        totalHours: 0,
        equipmentCount: 0,
        materialsCount: 0,
        diaryEntriesCount: 0,
      }}
      foremanList={foremanResult.data ?? []}
      timeEntries={timeResult.data ?? []}
      activeTab={tab}
      budgetUsed={budgetUsed}
    />
  )
}
