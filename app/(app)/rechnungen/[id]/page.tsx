import { notFound } from "next/navigation"
import {
  getInvoice,
  getInvoiceItems,
  getInvoiceReminders,
} from "@/lib/actions/invoices"
import { InvoiceDetail } from "@/components/modules/invoices/invoice-detail"
import { INVOICE_STATUSES } from "@/lib/utils/constants"
import type { Metadata } from "next"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data: invoice } = await getInvoice(id)
  return { title: invoice ? invoice.invoice_number : "Rechnung" }
}

export default async function RechnungDetailPage({ params }: Props) {
  const { id } = await params

  const [{ data: invoice }, { data: items = [] }, { data: reminders = [] }] =
    await Promise.all([
      getInvoice(id),
      getInvoiceItems(id),
      getInvoiceReminders(id),
    ])

  if (!invoice) notFound()

  const statusCfg = INVOICE_STATUSES[invoice.status as keyof typeof INVOICE_STATUSES] ?? {
    label: invoice.status,
    variant: "neutral" as const,
  }

  const isOverdue =
    invoice.status !== "paid" &&
    invoice.due_date &&
    new Date(invoice.due_date) < new Date()

  const outstandingAmount =
    invoice.status === "paid"
      ? 0
      : invoice.total - (invoice.paid_amount ?? 0)

  return (
    <InvoiceDetail
      id={id}
      invoice={invoice}
      items={items}
      reminders={reminders}
      statusLabel={statusCfg.label}
      statusVariant={statusCfg.variant}
      isOverdue={!!isOverdue}
      outstandingAmount={outstandingAmount}
    />
  )
}
