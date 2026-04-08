import { notFound } from "next/navigation"
import { getDiaryEntry } from "@/lib/actions/diary"
import { getSites } from "@/lib/actions/sites"
import { DiaryEdit } from "@/components/modules/diary/diary-edit"
import { formatDate } from "@/lib/utils/format"
import type { Metadata } from "next"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data: entry } = await getDiaryEntry(id)
  return {
    title: entry ? `Bericht bearbeiten – ${formatDate(entry.entry_date)}` : "Bericht bearbeiten",
  }
}

export default async function BautagesberichtBearbeitenPage({ params }: Props) {
  const { id } = await params

  const [{ data: entry }, { data: sitesData = [] }] = await Promise.all([
    getDiaryEntry(id),
    getSites(),
  ])

  if (!entry) notFound()

  const sites = sitesData.map((s) => ({ id: s.id, name: s.name }))

  return <DiaryEdit entry={entry} sites={sites} />
}
