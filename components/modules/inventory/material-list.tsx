"use client"

import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { DataTable } from "@/components/shared/data-table"
import { BundleManager } from "@/components/modules/inventory/bundle-manager"
import { MovementDialog } from "@/components/modules/inventory/movement-dialog"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Boxes,
  Plus,
  Star,
  Truck,
  ArrowUpDown,
} from "lucide-react"
import Link from "next/link"
import type {
  Material,
  Supplier,
  PurchaseOrder,
  Bundle,
  BundleItem,
  InventoryStats,
} from "@/lib/actions/inventory"
import type { Column } from "@/components/shared/data-table"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils/format"
import { UNIT_LABELS, getPurchaseOrderStatusConfig } from "@/lib/utils/constants"

function getUnitLabel(unit: string): string {
  return UNIT_LABELS[unit as keyof typeof UNIT_LABELS] ?? unit
}

type MaterialRow = Material & Record<string, unknown>
type SupplierRow = Supplier & Record<string, unknown>
type PORow = PurchaseOrder & Record<string, unknown>

const materialColumns: Column<MaterialRow>[] = [
  {
    key: "name",
    header: "Material",
    sortable: true,
    render: (item) => (
      <Link
        href={`/lager/materialien/${item.id}`}
        className="font-medium text-foreground hover:text-primary transition-colors"
      >
        {item.name}
        {item.article_number && (
          <span className="text-xs text-muted-foreground ml-2 font-normal">
            {item.article_number}
          </span>
        )}
      </Link>
    ),
  },
  {
    key: "category",
    header: "Kategorie",
    sortable: true,
    render: (item) => <span className="text-sm text-foreground">{item.category}</span>,
  },
  {
    key: "current_stock",
    header: "Bestand",
    sortable: true,
    render: (item) => {
      const stock = item.current_stock
      const minStock = item.min_stock
      const isBelowMin = minStock !== null && (stock ?? 0) < minStock
      return (
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${isBelowMin ? "text-danger" : "text-foreground"}`}
          >
            {stock !== null ? formatNumber(stock) : "—"} {getUnitLabel(item.unit)}
          </span>
          {isBelowMin && <AlertTriangle className="h-3.5 w-3.5 text-danger" />}
        </div>
      )
    },
  },
  {
    key: "min_stock",
    header: "Mindestbestand",
    render: (item) => (
      <span className="text-sm text-muted-foreground">
        {item.min_stock !== null
          ? `${formatNumber(item.min_stock)} ${getUnitLabel(item.unit)}`
          : "—"}
      </span>
    ),
  },
  {
    key: "price_per_unit",
    header: "Preis/Einheit",
    sortable: true,
    render: (item) => (
      <span className="text-sm text-foreground">
        {item.price_per_unit !== null ? formatCurrency(item.price_per_unit) : "—"}
      </span>
    ),
  },
  {
    key: "supplier_name",
    header: "Lieferant",
    render: (item) => (
      <span className="text-sm text-muted-foreground">{item.supplier_name ?? "—"}</span>
    ),
  },
]

const supplierColumns: Column<SupplierRow>[] = [
  {
    key: "name",
    header: "Lieferant",
    sortable: true,
    render: (item) => (
      <Link
        href={`/lager/lieferanten/${item.id}`}
        className="font-medium text-foreground hover:text-primary transition-colors"
      >
        {item.name}
      </Link>
    ),
  },
  {
    key: "contact_person",
    header: "Ansprechpartner",
    render: (item) => (
      <span className="text-sm text-foreground">{item.contact_person ?? "—"}</span>
    ),
  },
  {
    key: "phone",
    header: "Telefon",
    render: (item) =>
      item.phone ? (
        <a href={`tel:${item.phone}`} className="text-sm text-foreground hover:text-primary">
          {item.phone}
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    key: "email",
    header: "E-Mail",
    render: (item) =>
      item.email ? (
        <a href={`mailto:${item.email}`} className="text-sm text-foreground hover:text-primary">
          {item.email}
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    key: "rating",
    header: "Bewertung",
    sortable: true,
    render: (item) => {
      const rating = item.rating
      if (!rating) return <span className="text-sm text-muted-foreground">—</span>
      return (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-3.5 w-3.5 ${s <= rating ? "fill-warning text-warning" : "text-muted-foreground/40"}`}
            />
          ))}
        </div>
      )
    },
  },
]

const poColumns: Column<PORow>[] = [
  {
    key: "id",
    header: "Bestellung",
    render: (item) => (
      <Link
        href={`/lager/bestellungen/${item.id}`}
        className="font-medium text-foreground hover:text-primary transition-colors"
      >
        #{item.id.slice(0, 8)}
      </Link>
    ),
  },
  {
    key: "supplier_name",
    header: "Lieferant",
    sortable: true,
    render: (item) => <span className="text-sm text-foreground">{item.supplier_name ?? "—"}</span>,
  },
  {
    key: "order_date",
    header: "Bestelldatum",
    sortable: true,
    render: (item) => <span className="text-sm text-foreground">{formatDate(item.order_date)}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (item) => {
      const cfg = getPurchaseOrderStatusConfig(item.status)
      return <StatusBadge label={cfg.label} variant={cfg.variant} />
    },
  },
  {
    key: "total_amount",
    header: "Gesamt",
    sortable: true,
    render: (item) => (
      <span className="text-sm font-medium text-foreground">
        {item.total_amount != null ? formatCurrency(item.total_amount) : "—"}
      </span>
    ),
  },
]

interface MaterialListProps {
  stats: InventoryStats
  materials: Material[]
  suppliers: Supplier[]
  orders: PurchaseOrder[]
  bundles: Bundle[]
  bundleItemsMap: Record<string, BundleItem[]>
  belowMinMaterials: Material[]
  sites: { id: string; name: string }[]
}

export function MaterialList({
  stats,
  materials,
  suppliers,
  orders,
  bundles,
  bundleItemsMap,
  belowMinMaterials,
  sites,
}: MaterialListProps) {
  const materialRows = materials as MaterialRow[]
  const supplierRows = suppliers as SupplierRow[]
  const orderRows = orders as PORow[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lager & Einkauf"
        description="Materialbestand, Bestellungen und Lieferanten verwalten."
      >
        <MovementDialog
          materials={materials}
          sites={sites}
          trigger={
            <Button variant="outline" className="rounded-xl h-11 gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Bewegung buchen
            </Button>
          }
        />
        <Link href="/lager/materialien/neu">
          <Button className="rounded-xl h-11 font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Material hinzufügen
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Materialien" value={formatNumber(stats.totalMaterials)} icon={Package} />
        <StatCard
          title="Unter Mindestbestand"
          value={stats.belowMinStock}
          context={stats.belowMinStock > 0 ? "Nachbestellung empfohlen" : "Alles im grünen Bereich"}
          icon={AlertTriangle}
          className={stats.belowMinStock > 0 ? "border-l-4 border-l-danger" : ""}
        />
        <StatCard title="Offene Bestellungen" value={stats.openOrders} icon={ShoppingCart} />
        <StatCard
          title="Lagerwert (geschätzt)"
          value={formatCurrency(stats.stockValue)}
          icon={Boxes}
        />
      </div>

      {belowMinMaterials.length > 0 && (
        <div className="rounded-xl bg-danger/5 border border-danger/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-danger mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-danger">
              {belowMinMaterials.length} Material{belowMinMaterials.length === 1 ? "" : "ien"}{" "}
              unter Mindestbestand
            </p>
            <p className="text-xs text-danger/80 mt-0.5">
              {belowMinMaterials
                .slice(0, 3)
                .map((m) => m.name)
                .join(", ")}
              {belowMinMaterials.length > 3 && ` +${belowMinMaterials.length - 3} weitere`}
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="materialien">
        <TabsList className="h-11 rounded-xl">
          <TabsTrigger value="materialien" className="rounded-lg gap-2">
            <Package className="h-4 w-4" />
            Materialien
            <Badge variant="secondary" className="ml-1 rounded-full text-xs px-1.5 py-0">
              {materials.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="lieferanten" className="rounded-lg gap-2">
            <Truck className="h-4 w-4" />
            Lieferanten
            <Badge variant="secondary" className="ml-1 rounded-full text-xs px-1.5 py-0">
              {suppliers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="bestellungen" className="rounded-lg gap-2">
            <ShoppingCart className="h-4 w-4" />
            Bestellungen
            <Badge variant="secondary" className="ml-1 rounded-full text-xs px-1.5 py-0">
              {orders.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="buendel" className="rounded-lg gap-2">
            <Boxes className="h-4 w-4" />
            Bündel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materialien" className="mt-4">
          <Card className="rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Alle Materialien</h2>
                <Link href="/lager/materialien/neu">
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Neu
                  </Button>
                </Link>
              </div>
              <DataTable
                columns={materialColumns}
                data={materialRows}
                searchKey="name"
                searchPlaceholder="Material suchen..."
                pageSize={15}
                emptyState={{
                  icon: Package,
                  title: "Noch keine Materialien",
                  description:
                    "Legen Sie Ihr erstes Material an, um den Lagerbestand zu verwalten.",
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lieferanten" className="mt-4">
          <Card className="rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Alle Lieferanten</h2>
                <Link href="/lager/lieferanten/neu">
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Neu
                  </Button>
                </Link>
              </div>
              <DataTable
                columns={supplierColumns}
                data={supplierRows}
                searchKey="name"
                searchPlaceholder="Lieferant suchen..."
                pageSize={15}
                emptyState={{
                  icon: Truck,
                  title: "Noch keine Lieferanten",
                  description:
                    "Erfassen Sie Ihre Lieferanten für eine strukturierte Bestellverwaltung.",
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bestellungen" className="mt-4">
          <Card className="rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Alle Bestellungen</h2>
                <Link href="/lager/bestellungen/neu">
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Neu
                  </Button>
                </Link>
              </div>
              <DataTable
                columns={poColumns}
                data={orderRows}
                searchKey="supplier_name"
                searchPlaceholder="Lieferant suchen..."
                pageSize={15}
                emptyState={{
                  icon: ShoppingCart,
                  title: "Noch keine Bestellungen",
                  description: "Erstellen Sie Ihre erste Bestellung bei einem Lieferanten.",
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buendel" className="mt-4">
          <BundleManager bundles={bundles} bundleItems={bundleItemsMap} materials={materials} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
