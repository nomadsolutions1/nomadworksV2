"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Plus, ShoppingCart } from "lucide-react"
import type { PurchaseOrder } from "@/lib/actions/inventory"
import type { Column } from "@/components/shared/data-table"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { getPurchaseOrderStatusConfig } from "@/lib/utils/constants"

type PORow = PurchaseOrder & Record<string, unknown>

const columns: Column<PORow>[] = [
  {
    key: "id",
    header: "Bestellung",
    render: (row) => (
      <Link
        href={`/lager/bestellungen/${row.id}`}
        className="font-medium text-foreground hover:text-primary transition-colors"
      >
        #{row.id.slice(0, 8)}
      </Link>
    ),
  },
  {
    key: "supplier_name",
    header: "Lieferant",
    sortable: true,
    render: (row) => <span className="text-sm text-foreground">{row.supplier_name ?? "—"}</span>,
  },
  {
    key: "order_date",
    header: "Bestelldatum",
    sortable: true,
    render: (row) => <span className="text-sm text-foreground">{formatDate(row.order_date)}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => {
      const cfg = getPurchaseOrderStatusConfig(row.status)
      return <StatusBadge label={cfg.label} variant={cfg.variant} />
    },
  },
  {
    key: "total_amount",
    header: "Gesamt",
    sortable: true,
    render: (row) => (
      <span className="text-sm font-medium text-foreground">
        {row.total_amount != null ? formatCurrency(row.total_amount) : "—"}
      </span>
    ),
  },
]

interface Props {
  orders: PurchaseOrder[]
}

export function PurchaseOrderList({ orders }: Props) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: "Lager & Einkauf", href: "/lager" }, { label: "Bestellungen" }]}
      />
      <PageHeader title="Bestellungen" description="Einkaufsbestellungen bei Lieferanten verwalten.">
        <Link href="/lager/bestellungen/neu">
          <Button className="rounded-xl h-11 font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Bestellung erstellen
          </Button>
        </Link>
      </PageHeader>

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Noch keine Bestellungen"
          description="Erstellen Sie Ihre erste Bestellung bei einem Lieferanten."
          action={{
            label: "Bestellung erstellen",
            onClick: () => router.push("/lager/bestellungen/neu"),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={orders as PORow[]}
          searchKey="supplier_name"
          searchPlaceholder="Lieferant suchen..."
          pageSize={15}
        />
      )}
    </div>
  )
}
