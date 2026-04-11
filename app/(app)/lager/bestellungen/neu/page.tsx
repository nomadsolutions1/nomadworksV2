import { listSuppliers, listMaterials } from "@/lib/actions/inventory"
import { PurchaseOrderForm } from "@/components/modules/inventory/purchase-order-form"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Bestellung erstellen" }

export default async function NeueBestellungPage() {
  const [{ data: suppliers = [] }, { data: materials = [] }] = await Promise.all([
    listSuppliers(),
    listMaterials(),
  ])

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Lager & Einkauf", href: "/lager" },
          { label: "Bestellungen", href: "/lager/bestellungen" },
          { label: "Neu" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold font-heading text-foreground">Bestellung erstellen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Erstellen Sie eine neue Bestellung bei einem Lieferanten.
        </p>
      </div>
      <PurchaseOrderForm suppliers={suppliers} materials={materials} />
    </div>
  )
}
