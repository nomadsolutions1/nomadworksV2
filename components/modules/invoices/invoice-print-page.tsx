"use client"

import { InvoicePrint } from "@/components/modules/invoices/invoice-print"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Invoice, InvoiceItem } from "@/lib/actions/invoices"

interface InvoicePrintPageProps {
  id: string
  invoiceNumber: string
  invoice: Invoice
  items: InvoiceItem[]
  company: {
    name: string
    address: string | null
    phone: string | null
    email: string | null
    bank_name: string | null
    bank_iban: string | null
    bank_bic: string | null
    payment_terms_days: number | null
  }
  customer: {
    name: string
    address: string | null
    contact_person: string | null
    tax_id: string | null
  }
}

export function InvoicePrintPage({
  id,
  invoiceNumber,
  invoice,
  items,
  company,
  customer,
}: InvoicePrintPageProps) {
  return (
    <>
      {/* Print action bar -- hidden when printing */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <Link href={`/rechnungen/${id}`}>
          <Button
            variant="outline"
            className="rounded-xl h-9 gap-2 text-sm"
            aria-label="Zurueck zur Rechnung"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurueck
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Rechnung {invoiceNumber}
          </p>
          <Button
            onClick={() => {
              if (typeof window !== "undefined") window.print()
            }}
            className="rounded-xl font-semibold h-9 gap-2 text-sm"
            aria-label="Rechnung drucken oder als PDF speichern"
          >
            <Printer className="h-4 w-4" />
            Drucken / PDF
          </Button>
        </div>
      </div>

      {/* Print content */}
      <div className="pt-16">
        <InvoicePrint
          invoice={invoice}
          items={items}
          company={company}
          customer={customer}
        />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { padding-top: 0 !important; }
          .pt-16 { padding-top: 0 !important; }
        }
      `}</style>
    </>
  )
}
