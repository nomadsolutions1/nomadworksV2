import { getSites } from "@/lib/actions/sites"
import { DiaryNew } from "@/components/modules/diary/diary-new"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Bericht erstellen" }

type SearchParams = { site?: string }

export default async function NeuerBautagesberichtPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const { data: sitesData = [] } = await getSites()

  const sites = sitesData.map((s) => ({ id: s.id, name: s.name }))

  return <DiaryNew sites={sites} defaultSiteId={sp.site} />
}
