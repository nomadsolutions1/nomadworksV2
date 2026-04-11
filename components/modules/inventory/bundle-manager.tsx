"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { BundleCreateDialog } from "./bundle-create-dialog"
import { BundleItemDialog } from "./bundle-item-dialog"
import { Trash2, Boxes, Package } from "lucide-react"
import {
  removeBundleItem,
  deleteMaterialBundle,
} from "@/lib/actions/inventory"
import type { Bundle, BundleItem, Material } from "@/lib/actions/inventory"

interface Props {
  bundles: Bundle[]
  bundleItems: Record<string, BundleItem[]>
  materials: Material[]
}

export function BundleManager({ bundles: initialBundles, bundleItems: initialItems, materials }: Props) {
  const router = useRouter()
  const [bundles, setBundles] = useState(initialBundles)
  const [bundleItems, setBundleItems] = useState(initialItems)
  const [isPending, startTransition] = useTransition()

  function handleBundleCreated(bundle: Bundle) {
    setBundles((prev) => [...prev, bundle])
    setBundleItems((prev) => ({ ...prev, [bundle.id]: [] }))
    router.refresh()
  }

  function handleRemoveItem(itemId: string, bundleId: string) {
    startTransition(async () => {
      const result = await removeBundleItem(itemId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Material entfernt")
        setBundleItems((prev) => ({
          ...prev,
          [bundleId]: (prev[bundleId] || []).filter((i) => i.id !== itemId),
        }))
      }
    })
  }

  function handleDeleteBundle(id: string) {
    startTransition(async () => {
      const result = await deleteMaterialBundle(id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Bündel gelöscht")
        setBundles((prev) => prev.filter((b) => b.id !== id))
        setBundleItems((prev) => {
          const copy = { ...prev }
          delete copy[id]
          return copy
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Materialbündel</h2>
          <p className="text-sm text-muted-foreground">
            Gruppieren Sie Materialien für schnelle Baustellen-Zuweisung.
          </p>
        </div>
        <BundleCreateDialog onCreated={handleBundleCreated} />
      </div>

      {bundles.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Noch keine Bündel"
          description="Erstellen Sie Materialbündel, um häufig benötigte Kombinationen schnell einer Baustelle zuzuweisen."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bundles.map((bundle) => {
            const items = bundleItems[bundle.id] || []
            return (
              <Card
                key={bundle.id}
                className="rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {bundle.name}
                      </CardTitle>
                      {bundle.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{bundle.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <BundleItemDialog bundleId={bundle.id} materials={materials} />
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                        title="Bündel löschen"
                        description={`Möchten Sie das Bündel "${bundle.name}" wirklich löschen?`}
                        confirmLabel="Löschen"
                        onConfirm={() => handleDeleteBundle(bundle.id)}
                        destructive
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {items.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-center">
                      <div>
                        <Package className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Keine Materialien</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted group"
                        >
                          <div>
                            <span className="text-sm text-foreground">{item.material_name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {item.quantity} {item.material_unit}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id, bundle.id)}
                            disabled={isPending}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-all p-1 rounded"
                            aria-label="Position entfernen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">{items.length} Positionen</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
