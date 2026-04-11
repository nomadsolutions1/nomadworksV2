import { listSuppliers } from "@/lib/actions/inventory"
import { SupplierList } from "@/components/modules/inventory/supplier-list"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Lieferanten" }

export default async function LieferantenPage() {
  const { data: suppliers = [] } = await listSuppliers()
  return <SupplierList suppliers={suppliers} />
}
