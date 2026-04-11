"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { EmptyState } from "@/components/shared/empty-state"
import { StatCard } from "@/components/shared/stat-card"
import { MaterialForm } from "@/components/modules/inventory/material-form"
import { MovementDialog } from "@/components/modules/inventory/movement-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils/format"
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Edit,
  History,
  ArrowUpDown,
  Package,
  Gauge,
  Euro,
  Coins,
} from "lucide-react"
import type { Material, Supplier, InventoryMovement } from "@/lib/actions/inventory"

const MOVEMENT_ICONS = {
  in: ArrowDownToLine,
  out: ArrowUpFromLine,
  return: RotateCcw,
} as const

const MOVEMENT_LABELS: Record<string, string> = {
  in: "Eingang",
  out: "Ausgang",
  return: "Rückgabe",
}

const MOVEMENT_COLORS: Record<string, string> = {
  in: "text-success",
  out: "text-danger",
  return: "text-warning",
}

interface MaterialDetailProps {
  material: Material
  suppliers: Supplier[]
  movements: InventoryMovement[]
}

export function MaterialDetail({ material, suppliers, movements }: MaterialDetailProps) {
  const isBelowMin =
    material.min_stock !== null && (material.current_stock ?? 0) < material.min_stock

  const stockValue =
    material.current_stock !== null && material.price_per_unit !== null
      ? material.current_stock * material.price_per_unit
      : null

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumbs
        items={[{ label: "Lager & Einkauf", href: "/lager" }, { label: material.name }]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold font-heading text-foreground">
              {material.name}
            </h1>
            {isBelowMin && (
              <Badge variant="destructive" className="rounded-full gap-1 px-2 py-0.5 text-xs">
                <AlertTriangle className="h-3 w-3" />
                Unter Mindestbestand
              </Badge>
            )}
          </div>
          {material.article_number && (
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">
              {material.article_number}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">{material.category}</p>
        </div>
        <MovementDialog
          materials={[material]}
          defaultMaterialId={material.id}
          trigger={
            <Button className="rounded-xl h-11 font-semibold gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Bewegung buchen
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Aktueller Bestand"
          value={
            material.current_stock !== null
              ? `${formatNumber(material.current_stock)} ${material.unit}`
              : "—"
          }
          icon={Package}
          className={isBelowMin ? "border-l-4 border-l-danger" : ""}
        />
        <StatCard
          title="Mindestbestand"
          value={
            material.min_stock !== null
              ? `${formatNumber(material.min_stock)} ${material.unit}`
              : "—"
          }
          icon={Gauge}
        />
        <StatCard
          title="Preis/Einheit"
          value={material.price_per_unit !== null ? formatCurrency(material.price_per_unit) : "—"}
          context={`je ${material.unit}`}
          icon={Euro}
        />
        <StatCard
          title="Lagerwert"
          value={stockValue !== null ? formatCurrency(stockValue) : "—"}
          context="Bestand × Preis"
          icon={Coins}
        />
      </div>

      <Tabs defaultValue="verlauf">
        <TabsList className="h-11 rounded-xl">
          <TabsTrigger value="verlauf" className="rounded-lg gap-2">
            <History className="h-4 w-4" />
            Bewegungsverlauf
          </TabsTrigger>
          <TabsTrigger value="bearbeiten" className="rounded-lg gap-2">
            <Edit className="h-4 w-4" />
            Bearbeiten
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verlauf" className="mt-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Lagerbewegungen ({movements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="Noch keine Bewegungen"
                  description="Buchen Sie den ersten Warenein- oder -ausgang für dieses Material."
                />
              ) : (
                <div className="space-y-2">
                  {movements.map((mov) => {
                    const Icon = MOVEMENT_ICONS[mov.type as keyof typeof MOVEMENT_ICONS] ?? History
                    const label = MOVEMENT_LABELS[mov.type] ?? mov.type
                    const color = MOVEMENT_COLORS[mov.type] ?? "text-muted-foreground"
                    return (
                      <div
                        key={mov.id}
                        className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-muted border border-transparent hover:border-border transition-all"
                      >
                        <div className={`rounded-xl p-2 shrink-0 bg-muted ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{label}</span>
                            <span className={`text-sm font-semibold ${color}`}>
                              {mov.type === "out" ? "-" : "+"}
                              {formatNumber(mov.quantity)} {material.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{formatDate(mov.created_at)}</span>
                            {mov.site_name && (
                              <>
                                <span>·</span>
                                <span>{mov.site_name}</span>
                              </>
                            )}
                            {mov.created_by_name && (
                              <>
                                <span>·</span>
                                <span>{mov.created_by_name}</span>
                              </>
                            )}
                          </div>
                          {mov.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5">{mov.notes}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bearbeiten" className="mt-4">
          <MaterialForm mode="edit" material={material} suppliers={suppliers} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
