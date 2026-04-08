import type { Invoice, InvoiceItem } from "@/lib/actions/invoices"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { InvoicePrintItems } from "./invoice-print-items"

interface CompanyInfo {
  name: string
  address: string | null
  phone: string | null
  email: string | null
  bank_name: string | null
  bank_iban: string | null
  bank_bic: string | null
  payment_terms_days: number | null
}

interface CustomerInfo {
  name: string
  address: string | null
  contact_person: string | null
  tax_id: string | null
}

interface InvoicePrintProps {
  invoice: Invoice
  items: InvoiceItem[]
  company: CompanyInfo
  customer: CustomerInfo
}

export function InvoicePrint({ invoice, items, company, customer }: InvoicePrintProps) {
  const subtotal = invoice.subtotal
  const taxRate = invoice.tax_rate
  const taxAmount = invoice.tax_amount ?? 0
  const total = invoice.total

  return (
    <div className="invoice-print bg-white min-h-screen font-sans text-foreground">
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .invoice-print { padding: 0; }
          @page { margin: 2cm; size: A4; }
        }
        .invoice-print { max-width: 794px; margin: 0 auto; padding: 40px; font-size: 13px; line-height: 1.5; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 4px 0" }}>{company.name}</h1>
          {company.address && <p style={{ margin: "0", fontSize: "12px", whiteSpace: "pre-line", opacity: 0.6 }}>{company.address}</p>}
          {company.phone && <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.6 }}>Tel.: {company.phone}</p>}
          {company.email && <p style={{ margin: "2px 0 0 0", fontSize: "12px", opacity: 0.6 }}>E-Mail: {company.email}</p>}
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", margin: "0" }}>RECHNUNG</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.6 }}>Nr. {invoice.invoice_number}</p>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "2px solid currentColor", marginBottom: "32px" }} />

      {/* Customer + meta */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px 0", opacity: 0.5 }}>Rechnungsempfaenger</p>
          <p style={{ margin: "0", fontWeight: "600", fontSize: "14px" }}>{customer.name}</p>
          {customer.contact_person && <p style={{ margin: "2px 0 0 0", fontSize: "12px", opacity: 0.6 }}>z.Hd. {customer.contact_person}</p>}
          {customer.address && <p style={{ margin: "4px 0 0 0", fontSize: "12px", whiteSpace: "pre-line", opacity: 0.6 }}>{customer.address}</p>}
          {customer.tax_id && <p style={{ margin: "8px 0 0 0", fontSize: "11px", opacity: 0.5 }}>USt-IdNr.: {customer.tax_id}</p>}
        </div>
        <div style={{ textAlign: "right", minWidth: "200px" }}>
          <table style={{ marginLeft: "auto", fontSize: "12px", borderCollapse: "collapse" }}>
            <tbody>
              <MetaRow label="Rechnungsnr." value={invoice.invoice_number} bold />
              <MetaRow label="Rechnungsdatum" value={formatDate(invoice.invoice_date)} bold />
              {invoice.due_date && <MetaRow label="Zahlungsziel" value={formatDate(invoice.due_date)} bold />}
              {invoice.order_title && <MetaRow label="Auftrag" value={invoice.order_title} />}
            </tbody>
          </table>
        </div>
      </div>

      <InvoicePrintItems items={items} subtotal={subtotal} taxRate={taxRate} taxAmount={taxAmount} total={total} />

      {/* Notes */}
      {invoice.notes && (
        <div style={{ marginBottom: "32px", backgroundColor: "#f8fafc", borderLeft: "3px solid #1e3a5f", padding: "12px 16px", borderRadius: "4px" }}>
          <p style={{ margin: "0", fontSize: "12px", opacity: 0.6 }}>{invoice.notes}</p>
        </div>
      )}

      {/* Payment info */}
      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
        <p style={{ margin: "0 0 12px 0", fontWeight: "600", fontSize: "13px" }}>Bankverbindung</p>
        <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
          {company.bank_name && <BankField label="Bank" value={company.bank_name} />}
          {company.bank_iban && <BankField label="IBAN" value={company.bank_iban} mono />}
          {company.bank_bic && <BankField label="BIC" value={company.bank_bic} mono />}
        </div>
        {invoice.due_date && (
          <p style={{ marginTop: "12px", fontSize: "12px", opacity: 0.6 }}>
            Bitte ueberweisen Sie den Betrag von <strong>{formatCurrency(total)}</strong> bis zum{" "}
            <strong>{formatDate(invoice.due_date)}</strong> unter Angabe der Rechnungsnummer{" "}
            <strong>{invoice.invoice_number}</strong>.
            {company.payment_terms_days != null && <> Zahlungsziel: {company.payment_terms_days} Tage netto.</>}
          </p>
        )}
      </div>
    </div>
  )
}

function MetaRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr>
      <td style={{ paddingRight: "16px", paddingBottom: "4px", opacity: 0.6 }}>{label}:</td>
      <td style={bold ? { fontWeight: "600" } : undefined}>{value}</td>
    </tr>
  )
}

function BankField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p style={{ margin: "0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.5 }}>{label}</p>
      <p style={{ margin: "2px 0 0 0", fontSize: "13px", fontFamily: mono ? "monospace" : undefined, fontWeight: "500" }}>{value}</p>
    </div>
  )
}
