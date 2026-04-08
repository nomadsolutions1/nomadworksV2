"use client"

import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/utils/format"
import { getOrderStatusConfig } from "@/lib/utils/constants"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle2, Euro, Plus, Users } from "lucide-react"
import type { Column } from "@/components/shared/data-table"

type OrderRow = Record<string, unknown>

interface OrderListProps {
  orders: OrderRow[]
}

export function OrderList({ orders }: OrderListProps) {
  const router = useRouter()
  const total = orders.length
  const inProgress = orders.filter((o) => o.status === "in_progress").length
  const completed = orders.filter((o) => o.status === "completed").length
  const totalBudget = orders.reduce((sum, o) => sum + ((o.budget as number) ?? 0), 0)

  const columns: Column<OrderRow>[] = [
    {
      key: "title", header: "Auftrag", sortable: true,
      render: (row) => (
        <Link href={`/auftraege/${row.id as string}`} className="font-medium text-foreground hover:text-primary transition-colors">
          {row.title as string}
        </Link>
      ),
    },
    {
      key: "customer_name", header: "Kunde", sortable: true,
      render: (row) => <span className="text-muted-foreground">{(row.customer_name as string) || "—"}</span>,
    },
    {
      key: "site_count", header: "Baustellen",
      render: (row) => <span className="text-muted-foreground">{(row.site_count as number) || 0}</span>,
    },
    {
      key: "status", header: "Status", sortable: true,
      render: (row) => {
        const cfg = getOrderStatusConfig(row.status as string)
        return <StatusBadge label={cfg.label} variant={cfg.variant} />
      },
    },
    {
      key: "budget", header: "Budget", sortable: true,
      render: (row) => <span className="font-mono text-sm">{row.budget != null ? formatCurrency(row.budget as number) : "—"}</span>,
    },
    {
      key: "start_date", header: "Start",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.start_date ? new Date(row.start_date as string).toLocaleDateString("de-DE") : "—"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Aufträge" description="Verwalten Sie Ihre Aufträge von Angebot bis Abschluss.">
        <Link href="/auftraege/kunden">
          <Button variant="outline" className="rounded-xl h-11 gap-2"><Users className="h-4 w-4" /> Kunden</Button>
        </Link>
        <Link href="/auftraege/neu">
          <Button className="rounded-xl font-semibold h-11 gap-2"><Plus className="h-4 w-4" /> Auftrag anlegen</Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Aufträge gesamt" value={total} icon={FileText} />
        <StatCard title="In Arbeit" value={inProgress} icon={Clock} />
        <StatCard title="Abgeschlossen" value={completed} icon={CheckCircle2} />
        <StatCard title="Auftragswert gesamt" value={totalBudget > 0 ? formatCurrency(totalBudget) : "—"} context={total > 0 ? `Über ${total} ${total === 1 ? "Auftrag" : "Aufträge"}` : undefined} icon={Euro} />
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={FileText} title="Keine Aufträge vorhanden" description="Legen Sie Ihren ersten Auftrag an." action={{ label: "Auftrag anlegen", href: "/auftraege/neu" }} />
      ) : (
        <DataTable columns={columns} data={orders} searchKey="title" searchPlaceholder="Aufträge suchen..." pageSize={15} onRowClick={(row) => router.push(`/auftraege/${row.id}`)} />
      )}
    </div>
  )
}
