"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { SupplierForm } from "@/components/modules/inventory/supplier-form"
import type { Supplier } from "@/lib/actions/inventory"

interface SupplierDetailProps {
  supplier: Supplier
}

export function SupplierDetail({ supplier }: SupplierDetailProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Lager & Einkauf", href: "/lager" },
          { label: "Lieferanten", href: "/lager/lieferanten" },
          { label: supplier.name },
        ]}
      />

      <div>
        <h1 className="text-2xl font-semibold font-heading text-foreground">{supplier.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">Lieferantendaten bearbeiten</p>
      </div>

      <SupplierForm mode="edit" supplier={supplier} />
    </div>
  )
}
