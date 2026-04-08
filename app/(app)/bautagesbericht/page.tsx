import { getDiaryEntries, getDiaryStats } from "@/lib/actions/diary"
import { getSites } from "@/lib/actions/sites"
import { DiaryList } from "@/components/modules/diary/diary-list"
import { TipsBanner } from "@/components/shared/tips-banner"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Bautagesbericht" }

type SearchParams = { site?: string; from?: string; to?: string }

export default async function BautagesberichtPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const siteFilter = sp.site || undefined
  const dateFrom = sp.from || undefined
  const dateTo = sp.to || undefined

  const [{ data: entries = [] }, { data: stats }, { data: sites = [] }] = await Promise.all([
    getDiaryEntries(siteFilter, dateFrom, dateTo),
    getDiaryStats(),
    getSites(),
  ])

  const tableData = entries.map((e) => ({ ...e } as Record<string, unknown>))
  const siteOptions = sites.map((s) => ({ id: s.id, name: s.name }))

  return (
    <>
      <TipsBanner module="bautagesbericht" />
      <DiaryList
        entries={tableData}
        stats={{
          monthCount: stats?.monthCount ?? 0,
          todayCount: stats?.todayCount ?? 0,
          sitesWithEntries: stats?.sitesWithEntries ?? 0,
          documentCount: stats?.documentCount ?? 0,
        }}
        siteOptions={siteOptions}
      />
    </>
  )
}
