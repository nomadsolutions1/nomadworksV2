"use client"

import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Building2, Plus } from "lucide-react"
import type { Column } from "@/components/shared/data-table"
import { CustomerActions } from "@/components/modules/orders/customer-actions"

type CustomerRow = Record<string, unknown>

interface CustomerListProps {
  customers: CustomerRow[]
}

export function CustomerList({ customers }: CustomerListProps) {
  const total = customers.length
  const withEmail = customers.filter((c) => c.email).length

  const columns: Column<CustomerRow>[] = [
    { key: "name", header: "Name", sortable: true, render: (row) => <span className="font-medium text-foreground">{row.name as string}</span> },
    { key: "contact_person", header: "Ansprechpartner", render: (row) => <span className="text-muted-foreground">{(row.contact_person as string) || "—"}</span> },
    { key: "email", header: "E-Mail", render: (row) => row.email ? <a href={`mailto:${row.email as string}`} className="text-primary hover:underline text-sm">{row.email as string}</a> : <span className="text-muted-foreground">—</span> },
    { key: "phone", header: "Telefon", render: (row) => <span className="text-muted-foreground text-sm">{(row.phone as string) || "—"}</span> },
    { key: "address", header: "Adresse", render: (row) => <span className="text-muted-foreground text-sm">{(row.address as string) || "—"}</span> },
    { key: "actions", header: "", render: (row) => <CustomerActions customerId={row.id as string} /> },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Aufträge", href: "/auftraege" }, { label: "Kunden" }]} />
      <PageHeader title="Kunden" description="Verwalten Sie Ihre Kunden und Auftraggeber.">
        <Link href="/auftraege/kunden/neu">
          <Button className="rounded-xl font-semibold h-11 gap-2"><Plus className="h-4 w-4" /> Kunde anlegen</Button>
        </Link>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Kunden gesamt" value={total} icon={Users} />
        <StatCard title="Mit E-Mail" value={withEmail} icon={Building2} />
        <StatCard title="Mit USt-ID" value={0} icon={Building2} />
      </div>
      {customers.length === 0 ? (
        <EmptyState icon={Users} title="Keine Kunden vorhanden" description="Legen Sie Ihren ersten Kunden an." action={{ label: "Kunde anlegen", href: "/auftraege/kunden/neu" }} />
      ) : (
        <DataTable columns={columns} data={customers} searchKey="name" searchPlaceholder="Kunden suchen..." pageSize={15} />
      )}
    </div>
  )
}
