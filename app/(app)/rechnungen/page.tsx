import { getInvoices } from "@/lib/actions/invoices"
import { InvoiceList } from "@/components/modules/invoices/invoice-list"
import { TipsBanner } from "@/components/shared/tips-banner"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Rechnungen" }

export default async function RechnungenPage() {
  const { data: invoices = [] } = await getInvoices()
  const tableData = invoices.map((inv) => ({ ...inv } as Record<string, unknown>))

  return (
    <>
      <TipsBanner module="rechnungen" />
      <InvoiceList invoices={tableData} />
    </>
  )
}
