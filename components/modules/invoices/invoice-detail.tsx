"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import type { StatusBadgeVariant } from "@/components/shared/status-badge"
import { InvoiceItemsEditor } from "@/components/modules/invoices/invoice-items-editor"
import { ReminderSection } from "@/components/modules/invoices/reminder-section"
import { InvoiceStatusChanger } from "@/components/modules/invoices/invoice-status-changer"
import { MarkPaidDialog } from "@/components/modules/invoices/mark-paid-dialog"
import { InvoiceOverviewTab } from "@/components/modules/invoices/invoice-overview-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import {
  Euro,
  Calendar,
  FileText,
  Bell,
  Printer,
  CheckCircle2,
  Receipt,
} from "lucide-react"
import Link from "next/link"
import type { Invoice, InvoiceItem, InvoiceReminder } from "@/lib/actions/invoices"

interface InvoiceDetailProps {
  id: string
  invoice: Invoice
  items: InvoiceItem[]
  reminders: InvoiceReminder[]
  statusLabel: string
  statusVariant: StatusBadgeVariant
  isOverdue: boolean
  outstandingAmount: number
}

export function InvoiceDetail({
  id,
  invoice,
  items,
  reminders,
  statusLabel,
  statusVariant,
  isOverdue,
  outstandingAmount,
}: InvoiceDetailProps) {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Rechnungen", href: "/rechnungen" },
          { label: invoice.invoice_number },
        ]}
      />

      <PageHeader
        title={invoice.invoice_number}
        description={invoice.customer_name ?? undefined}
      >
        <Link href={`/rechnungen/${id}/drucken`} target="_blank">
          <Button variant="outline" className="rounded-xl h-9 gap-2 text-sm" aria-label="Rechnung drucken">
            <Printer className="h-4 w-4" />
            Drucken
          </Button>
        </Link>
        {invoice.status !== "paid" && (
          <MarkPaidDialog invoiceId={id} total={invoice.total} />
        )}
        <InvoiceStatusChanger invoiceId={id} currentStatus={invoice.status} />
      </PageHeader>

      {/* Overdue warning */}
      {isOverdue && invoice.status !== "paid" && (
        <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4">
          <Calendar className="h-5 w-5 text-danger shrink-0" />
          <p className="text-sm font-medium text-danger">
            Diese Rechnung ist seit {formatDate(invoice.due_date!)} faellig und noch nicht bezahlt.
          </p>
        </div>
      )}

      {/* Finance cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Nettobetrag" value={formatCurrency(invoice.subtotal)} icon={FileText} />
        <StatCard title="MwSt." value={invoice.tax_amount != null ? formatCurrency(invoice.tax_amount) : "\u2014"} context={invoice.tax_rate != null ? `${invoice.tax_rate} %` : undefined} icon={Euro} />
        <StatCard title="Gesamtbetrag" value={formatCurrency(invoice.total)} icon={Receipt} />
        <StatCard
          title={invoice.status === "paid" ? "Bezahlt" : "Ausstehend"}
          value={invoice.status === "paid" ? formatCurrency(invoice.paid_amount ?? invoice.total) : formatCurrency(outstandingAmount)}
          icon={CheckCircle2}
          className={invoice.status === "paid" ? "border-success/30" : outstandingAmount > 0 ? "border-danger/30" : ""}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="uebersicht" className="space-y-4">
        <TabsList className="rounded-xl bg-muted p-1 h-auto gap-1">
          <TabsTrigger value="uebersicht" className="rounded-lg text-sm" aria-label="Tab Uebersicht">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Uebersicht
          </TabsTrigger>
          <TabsTrigger value="positionen" className="rounded-lg text-sm" aria-label="Tab Positionen">
            <Receipt className="h-3.5 w-3.5 mr-1.5" />
            Positionen
          </TabsTrigger>
          <TabsTrigger value="mahnungen" className="rounded-lg text-sm" aria-label="Tab Mahnungen">
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            Mahnungen
            {reminders.length > 0 && (
              <span className="ml-1.5 rounded-full bg-danger text-white text-xs px-1.5 py-0.5 leading-none">
                {reminders.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uebersicht" className="space-y-4">
          <InvoiceOverviewTab
            id={id}
            invoice={invoice}
            statusLabel={statusLabel}
            statusVariant={statusVariant}
            isOverdue={isOverdue}
            outstandingAmount={outstandingAmount}
          />
        </TabsContent>

        <TabsContent value="positionen">
          <InvoiceItemsEditor invoiceId={id} items={items} taxRate={invoice.tax_rate} />
        </TabsContent>

        <TabsContent value="mahnungen">
          <ReminderSection invoiceId={id} invoiceStatus={invoice.status} reminders={reminders} dueAmount={outstandingAmount} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
