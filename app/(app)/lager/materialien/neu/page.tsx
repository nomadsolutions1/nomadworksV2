import { listSuppliers } from "@/lib/actions/inventory"
import { MaterialForm } from "@/components/modules/inventory/material-form"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Material anlegen" }

export default async function NeuesMaterialPage() {
  const { data: suppliers = [] } = await listSuppliers()

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumbs
        items={[{ label: "Lager & Einkauf", href: "/lager" }, { label: "Material anlegen" }]}
      />
      <div>
        <h1 className="text-2xl font-semibold font-heading text-foreground">Material anlegen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Erfassen Sie ein neues Material mit Bestandsinformationen.
        </p>
      </div>
      <MaterialForm mode="create" suppliers={suppliers} />
    </div>
  )
}
