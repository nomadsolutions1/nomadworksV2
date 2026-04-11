import { SupplierForm } from "@/components/modules/inventory/supplier-form"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Lieferant anlegen" }

export default function NeuerLieferantPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Lager & Einkauf", href: "/lager" },
          { label: "Lieferanten", href: "/lager/lieferanten" },
          { label: "Neu" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold font-heading text-foreground">Lieferant anlegen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Erfassen Sie einen neuen Lieferanten für Ihre Bestellverwaltung.
        </p>
      </div>
      <SupplierForm mode="create" />
    </div>
  )
}
