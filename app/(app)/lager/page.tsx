import {
  listMaterials,
  listSuppliers,
  listPurchaseOrders,
  listMaterialBundles,
  listBundleItems,
  getInventoryStats,
} from "@/lib/actions/inventory"
import { getSites } from "@/lib/actions/sites"
import { MaterialList } from "@/components/modules/inventory/material-list"
import { TipsBanner } from "@/components/shared/tips-banner"
import type { Metadata } from "next"
import type { BundleItem } from "@/lib/actions/inventory"

export const metadata: Metadata = { title: "Lager & Einkauf" }

export default async function LagerPage() {
  const [statsResult, materialsResult, suppliersResult, ordersResult, bundlesResult, sitesResult] =
    await Promise.all([
      getInventoryStats(),
      listMaterials(),
      listSuppliers(),
      listPurchaseOrders(),
      listMaterialBundles(),
      getSites(),
    ])

  const stats = statsResult.data ?? {
    totalMaterials: 0,
    belowMinStock: 0,
    openOrders: 0,
    stockValue: 0,
  }
  const materials = materialsResult.data ?? []
  const suppliers = suppliersResult.data ?? []
  const orders = ordersResult.data ?? []
  const bundles = bundlesResult.data ?? []

  // Bundle items parallel
  const bundleItemsMap: Record<string, BundleItem[]> = {}
  if (bundles.length > 0) {
    const results = await Promise.all(bundles.map((b) => listBundleItems(b.id)))
    bundles.forEach((b, i) => {
      bundleItemsMap[b.id] = results[i].data ?? []
    })
  }

  const belowMinMaterials = materials.filter(
    (m) => m.min_stock !== null && (m.current_stock ?? 0) < m.min_stock
  )

  const activeSites = (sitesResult.data ?? [])
    .filter((s) => s.status === "active")
    .map((s) => ({ id: s.id, name: s.name }))

  return (
    <>
      <TipsBanner module="lager" />
      <MaterialList
        stats={stats}
        materials={materials}
        suppliers={suppliers}
        orders={orders}
        bundles={bundles}
        bundleItemsMap={bundleItemsMap}
        belowMinMaterials={belowMinMaterials}
        sites={activeSites}
      />
    </>
  )
}
