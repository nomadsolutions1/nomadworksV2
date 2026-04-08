"use client"

import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { getInvoiceStatusConfig } from "@/lib/utils/constants"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Receipt,
  FileCheck2,
  FileText,
  Clock,
  AlertTriangle,
  FilePen,
  Euro,
} from "lucide-react"
import type { Column } from "@/components/shared/data-table"

type InvoiceRow = Record<string, unknown>

interface InvoiceListProps {
  invoices: InvoiceRow[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const router = useRouter()
  const total = invoices.length
  const draft = invoices.filter((i) => i.status === "draft").length
  const paid = invoices.filter((i) => i.status === "paid").length
  const open = invoices.filter((i) => i.status === "sent").length
  const overdue = invoices.filter((i) => i.status === "overdue").length
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + ((i.paid_amount as number) ?? (i.total as number)), 0)
  const openVolume = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + (i.total as number), 0)

  const columns: Column<InvoiceRow>[] = [
    {
      key: "invoice_number",
      header: "Nr.",
      sortable: true,
      render: (row) => (
        <Link
          href={`/rechnungen/${row.id as string}`}
          className="font-mono font-semibold text-primary hover:underline text-sm"
          aria-label={`Rechnung ${row.invoice_number as string} oeffnen`}
        >
          {row.invoice_number as string}
        </Link>
      ),
    },
    {
      key: "customer_name",
      header: "Kunde",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-foreground">
          {(row.customer_name as string) || "\u2014"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Betrag",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm font-semibold">
          {formatCurrency(row.total as number)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => {
        const cfg = getInvoiceStatusConfig(row.status as string)
        return <StatusBadge label={cfg.label} variant={cfg.variant} />
      },
    },
    {
      key: "invoice_date",
      header: "Datum",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.invoice_date ? formatDate(row.invoice_date as string) : "\u2014"}
        </span>
      ),
    },
    {
      key: "due_date",
      header: "Fällig am",
      render: (row) => {
        const dueDate = row.due_date as string | null
        if (!dueDate) return <span className="text-muted-foreground text-sm">\u2014</span>
        const isOverdue =
          row.status !== "paid" && new Date(dueDate) < new Date()
        return (
          <span
            className={`text-sm ${isOverdue ? "text-danger font-medium" : "text-muted-foreground"}`}
          >
            {formatDate(dueDate)}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rechnungen"
        description="Verwalten Sie Ihre Rechnungen und das Mahnwesen."
      >
        <Link href="/rechnungen/neu">
          <Button
            className="rounded-xl font-semibold h-11 gap-2"
            aria-label="Neue Leistungsrechnung erstellen"
          >
            <FileText className="h-4 w-4" />
            Leistungsrechnung
          </Button>
        </Link>
        <Link href="/rechnungen/regie">
          <Button
            variant="outline"
            className="rounded-xl font-semibold h-11 gap-2"
            aria-label="Neue Regierechnung erstellen"
          >
            <Clock className="h-4 w-4" />
            Regierechnung
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Gesamt" value={total} icon={Receipt} />
        <StatCard title="Entwurf" value={draft} icon={FilePen} />
        <StatCard
          title="Bezahlt"
          value={paid > 0 ? formatCurrency(totalRevenue) : paid}
          icon={FileCheck2}
          context={paid > 0 ? `${paid} Rechnungen` : undefined}
        />
        <StatCard
          title="Offen"
          value={open > 0 ? formatCurrency(openVolume) : open}
          icon={Clock}
          context={open > 0 ? `${open} Rechnungen` : undefined}
        />
        <StatCard
          title="Überfällig"
          value={overdue}
          icon={AlertTriangle}
          className={overdue > 0 ? "border-danger/30" : ""}
        />
      </div>

      {/* Revenue summary */}
      {invoices.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Eingang (bezahlt)</p>
                <p className="text-lg font-semibold font-mono text-primary">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-accent/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/10 p-2">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Ausstehend (offen + überfällig)
                </p>
                <p className="text-lg font-semibold font-mono text-accent-foreground">
                  {formatCurrency(openVolume)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Keine Rechnungen vorhanden"
          description="Erstellen Sie Ihre erste Rechnung — aus einem bestehenden Auftrag oder manuell."
          action={{ label: "Rechnung erstellen", href: "/rechnungen/neu" }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          searchKey="invoice_number"
          searchPlaceholder="Rechnungsnummer suchen..."
          pageSize={15}
          onRowClick={(row) => router.push(`/rechnungen/${row.id}`)}
        />
      )}
    </div>
  )
}
