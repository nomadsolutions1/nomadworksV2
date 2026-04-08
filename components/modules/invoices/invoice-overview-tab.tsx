"use client"

import { StatusBadge, type StatusBadgeVariant } from "@/components/shared/status-badge"
import { MarkPaidDialog } from "@/components/modules/invoices/mark-paid-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Calendar, User, CheckCircle2 } from "lucide-react"
import type { Invoice } from "@/lib/actions/invoices"

interface InvoiceOverviewTabProps {
  id: string
  invoice: Invoice
  statusLabel: string
  statusVariant: StatusBadgeVariant
  isOverdue: boolean
  outstandingAmount: number
}

export function InvoiceOverviewTab({
  id,
  invoice,
  statusLabel,
  statusVariant,
  isOverdue,
  outstandingAmount,
}: InvoiceOverviewTabProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Invoice details */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Rechnungsdetails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailRow label="Status">
            <StatusBadge label={statusLabel} variant={statusVariant} />
          </DetailRow>
          <DetailRow label="Rechnungsnummer">
            <span className="text-sm font-mono font-semibold text-foreground">
              {invoice.invoice_number}
            </span>
          </DetailRow>
          <DetailRow label="Kunde" icon={<User className="h-3.5 w-3.5" />}>
            <span className="text-sm font-medium text-foreground">
              {invoice.customer_name || "\u2014"}
            </span>
          </DetailRow>
          {invoice.order_title && (
            <DetailRow label="Auftrag">
              <span className="text-sm font-medium text-foreground">
                {invoice.order_title}
              </span>
            </DetailRow>
          )}
          <DetailRow label="Rechnungsdatum" icon={<Calendar className="h-3.5 w-3.5" />}>
            <span className="text-sm font-medium text-foreground">
              {formatDate(invoice.invoice_date)}
            </span>
          </DetailRow>
          {invoice.due_date && (
            <DetailRow label="Zahlungsziel" icon={<Calendar className="h-3.5 w-3.5" />}>
              <span className={`text-sm font-medium ${isOverdue ? "text-danger" : "text-foreground"}`}>
                {formatDate(invoice.due_date)}
              </span>
            </DetailRow>
          )}
          {invoice.status === "paid" && invoice.paid_date && (
            <DetailRow label="Zahlung eingegangen" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
              <span className="text-sm font-medium text-success">
                {formatDate(invoice.paid_date)}
              </span>
            </DetailRow>
          )}
          {invoice.notes && (
            <div className="py-2">
              <span className="text-sm text-muted-foreground">Notizen</span>
              <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial summary */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Finanzuebersicht
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <FinanceRow label="Nettobetrag" value={formatCurrency(invoice.subtotal)} />
            {invoice.tax_rate != null && (
              <FinanceRow label={`MwSt. (${invoice.tax_rate} %)`} value={formatCurrency(invoice.tax_amount ?? 0)} />
            )}
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-semibold text-foreground">Gesamtbetrag</span>
              <span className="text-base font-mono font-semibold text-primary">{formatCurrency(invoice.total)}</span>
            </div>
            {invoice.paid_amount != null && (
              <FinanceRow label="Bezahlt" value={formatCurrency(invoice.paid_amount)} valueClass="text-success" />
            )}
            {outstandingAmount > 0 && invoice.status !== "paid" && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-semibold text-danger">Ausstehend</span>
                <span className="text-base font-mono font-semibold text-danger">{formatCurrency(outstandingAmount)}</span>
              </div>
            )}
          </div>

          {invoice.status === "paid" && (
            <div className="flex items-center gap-2 rounded-xl bg-success/10 border border-success/20 p-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-semibold text-success">Vollstaendig bezahlt</p>
                {invoice.paid_date && (
                  <p className="text-xs text-muted-foreground">am {formatDate(invoice.paid_date)}</p>
                )}
              </div>
            </div>
          )}

          {invoice.status !== "paid" && (
            <div className="pt-2">
              <MarkPaidDialog invoiceId={id} total={invoice.total} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DetailRow({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b">
      <span className="text-sm text-muted-foreground flex items-center gap-1.5">{icon}{label}</span>
      {children}
    </div>
  )
}

function FinanceRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono font-medium ${valueClass ?? ""}`}>{value}</span>
    </div>
  )
}
