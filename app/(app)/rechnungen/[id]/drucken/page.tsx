import { notFound } from "next/navigation"
import { getInvoice, getInvoiceItems } from "@/lib/actions/invoices"
import { InvoicePrintPage } from "@/components/modules/invoices/invoice-print-page"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data: invoice } = await getInvoice(id)
  return {
    title: invoice
      ? `Rechnung ${invoice.invoice_number} — Druck`
      : "Rechnung drucken",
  }
}

export default async function RechnungDruckenPage({ params }: Props) {
  const { id } = await params

  const [{ data: invoice }, { data: items = [] }] = await Promise.all([
    getInvoice(id),
    getInvoiceItems(id),
  ])

  if (!invoice) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (!profile?.company_id) notFound()

  const { data: company } = await supabase
    .from("companies")
    .select(
      "name, address, tax_id, bank_name, bank_iban, bank_bic, payment_terms_days"
    )
    .eq("id", profile.company_id)
    .single()
    .throwOnError()

  const { data: customer } = await supabase
    .from("customers")
    .select("name, address, contact_person, phone, email")
    .eq("id", invoice.customer_id)
    .single()
    .throwOnError()

  if (!company || !customer) notFound()

  return (
    <InvoicePrintPage
      id={id}
      invoiceNumber={invoice.invoice_number}
      invoice={invoice}
      items={items}
      company={{
        name: company.name,
        address: company.address,
        phone: null,
        email: null,
        bank_name: company.bank_name,
        bank_iban: company.bank_iban,
        bank_bic: company.bank_bic,
        payment_terms_days: company.payment_terms_days,
      }}
      customer={{
        name: customer.name,
        address: customer.address,
        contact_person: customer.contact_person,
        tax_id: null,
      }}
    />
  )
}
