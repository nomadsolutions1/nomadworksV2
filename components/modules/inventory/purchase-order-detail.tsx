"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { StatusBadge } from "@/components/shared/status-badge"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PurchaseOrderActions } from "@/components/modules/inventory/purchase-order-actions"
import { PurchaseOrderDeliveryInput } from "@/components/modules/inventory/purchase-order-delivery-input"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils/format"
import { getPurchaseOrderStatusConfig } from "@/lib/utils/constants"
import { Package, ListOrdered, Euro, TrendingUp } from "lucide-react"
import type { PurchaseOrder, PurchaseOrderItem, Material } from "@/lib/actions/inventory"

interface Props {
  order: PurchaseOrder
  items: PurchaseOrderItem[]
  materials: Material[]
  orderId: string
}

export function PurchaseOrderDetail({ order, items, materials, orderId }: Props) {
  const statusCfg = getPurchaseOrderStatusConfig(order.status)

  const totalOrdered = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalDelivered = items.reduce((sum, i) => sum + i.delivered_quantity, 0)
  const deliveryPercent =
    totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumbs
        items={[
          { label: "Lager & Einkauf", href: "/lager" },
          { label: "Bestellungen" },
          { label: `#${orderId.slice(0, 8)}` },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold font-heading text-foreground">
              Bestellung #{orderId.slice(0, 8)}
            </h1>
            <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {order.supplier_name ?? "Unbekannter Lieferant"} · Bestellt am{" "}
            {formatDate(order.order_date)}
          </p>
        </div>
        <PurchaseOrderActions order={order} materials={materials} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Positionen" value={items.length} icon={ListOrdered} />
        <StatCard
          title="Bestellsumme"
          value={order.total_amount !== null ? formatCurrency(order.total_amount) : "—"}
          icon={Euro}
        />
        <StatCard title="Lieferstatus" value={`${deliveryPercent}%`} icon={TrendingUp} />
        <StatCard
          title="Bestellt gesamt"
          value={formatNumber(totalOrdered)}
          context="Positionen"
          icon={Package}
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Bestellpositionen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Keine Positionen in dieser Bestellung
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground pb-3 pr-4">
                      Material
                    </th>
                    <th className="text-right font-medium text-muted-foreground pb-3 px-4">
                      Bestellt
                    </th>
                    <th className="text-right font-medium text-muted-foreground pb-3 px-4">
                      Geliefert
                    </th>
                    <th className="text-right font-medium text-muted-foreground pb-3 px-4">
                      Einzelpreis
                    </th>
                    <th className="pb-3 pl-4 w-40">Lieferung erfassen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => {
                    const isFullyDelivered = item.delivered_quantity >= item.quantity
                    return (
                      <tr key={item.id} className="hover:bg-muted">
                        <td className="py-3 pr-4">
                          <span className="font-medium text-foreground">
                            {item.material_name ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-foreground">
                          {formatNumber(item.quantity)} {item.material_unit}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={
                              isFullyDelivered
                                ? "text-success font-medium"
                                : "text-warning font-medium"
                            }
                          >
                            {formatNumber(item.delivered_quantity)} {item.material_unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-foreground">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3 pl-4">
                          <PurchaseOrderDeliveryInput
                            itemId={item.id}
                            orderId={orderId}
                            quantityOrdered={item.quantity}
                            quantityDelivered={item.delivered_quantity}
                            unit={item.material_unit ?? ""}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {order.notes && (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground mb-1">Notizen</p>
            <p className="text-sm text-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
