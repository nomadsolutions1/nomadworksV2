import { notFound } from "next/navigation"
import { getDiaryEntry, getDiaryDocuments, getDiaryPhotos } from "@/lib/actions/diary"
import { DiaryDetail } from "@/components/modules/diary/diary-detail"
import { formatDate } from "@/lib/utils/format"
import type { Metadata } from "next"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data: entry } = await getDiaryEntry(id)
  return {
    title: entry ? `Bautagesbericht ${formatDate(entry.entry_date)}` : "Bautagesbericht",
  }
}

export default async function BautagesberichtDetailPage({ params }: Props) {
  const { id } = await params

  const [{ data: entry }, { data: documents = [] }, { data: photos = [] }] = await Promise.all([
    getDiaryEntry(id),
    getDiaryDocuments(id),
    getDiaryPhotos(id),
  ])

  if (!entry) notFound()

  return <DiaryDetail entry={entry} documents={documents} photos={photos} />
}
