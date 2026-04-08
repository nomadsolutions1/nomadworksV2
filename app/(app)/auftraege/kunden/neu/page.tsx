import { CustomerNew } from "@/components/modules/orders/customer-new"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Kunde anlegen" }

export default function NeuerKundePage() {
  return <CustomerNew />
}
