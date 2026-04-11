import { listSubcontractors } from "@/lib/actions/subcontractors"
import { SubcontractorList } from "@/components/modules/subcontractors/subcontractor-list"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Subunternehmer" }

export default async function SubunternehmerPage() {
  const { data: subcontractors = [] } = await listSubcontractors()
  return <SubcontractorList subcontractors={subcontractors} />
}
