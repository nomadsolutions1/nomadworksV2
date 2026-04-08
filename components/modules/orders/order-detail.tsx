"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { OrderOverviewTab } from "@/components/modules/orders/order-overview-tab"
import { OrderItemsTab } from "@/components/modules/orders/order-items-tab"
import { OrderCostsTab } from "@/components/modules/orders/order-costs-tab"
import { OrderMeasurementsTab } from "@/components/modules/orders/order-measurements-tab"
import { CostComparison } from "@/components/modules/orders/cost-comparison"
import { OrderSiteCosts } from "@/components/modules/orders/order-site-costs"
import { OrderStatusChanger } from "@/components/modules/orders/order-status-changer"
import { OrderTeamTab } from "@/components/modules/orders/order-team-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatPercent } from "@/lib/utils/format"
import { Euro, Users, TrendingUp, AlertTriangle, Receipt, BarChart2, FileText, MapPin, UserCheck } from "lucide-react"
import type { Order, OrderItem, OrderCostsByCategory, OrderMeasurement, OrderFinancials, OrderTeamMember } from "@/lib/actions/orders"

interface OrderDetailProps {
  order: Order
  items: OrderItem[]
  costsByCategory: OrderCostsByCategory[]
  measurements: OrderMeasurement[]
  financials: OrderFinancials
  team: OrderTeamMember[]
  orderValue: number
}

export function OrderDetail({ order, items, costsByCategory, measurements, financials: fin, team, orderValue }: OrderDetailProps) {
  const budget = order.budget ?? orderValue
  const personalCosts = fin.costsByCategory["personal"] || 0
  const otherCosts = fin.totalCosts - personalCosts

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Aufträge", href: "/auftraege" }, { label: order.title }]} />
      <PageHeader title={order.title} description={order.customer_name ?? undefined}>
        <OrderStatusChanger orderId={order.id} currentStatus={order.status} />
      </PageHeader>

      {fin.budgetUsedPercent > 80 && fin.totalCosts > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm font-medium text-warning">
            Budgetwarnung: {Math.round(fin.budgetUsedPercent)}% des Budgets verbraucht
            {fin.budgetUsedPercent >= 100 && " — Budget überschritten!"}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Auftragswert" value={orderValue > 0 ? formatCurrency(orderValue) : formatCurrency(budget)} icon={Euro} />
        <StatCard title="Personalkosten" value={personalCosts > 0 ? formatCurrency(personalCosts) : "—"} icon={Users} />
        <StatCard title="Sonstige Kosten" value={otherCosts > 0 ? formatCurrency(otherCosts) : "—"} icon={Receipt} />
        <StatCard title="Gewinn" value={formatCurrency(fin.margin)} icon={TrendingUp} className={fin.margin < 0 ? "border-danger/30" : ""} />
        <StatCard title="Marge" value={formatPercent(fin.marginPercent)} icon={BarChart2} className={fin.marginPercent < 0 ? "border-danger/30" : ""} />
      </div>

      <Tabs defaultValue="uebersicht" className="space-y-4">
        <TabsList className="rounded-xl bg-muted p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="uebersicht" className="rounded-lg text-sm"><FileText className="h-3.5 w-3.5 mr-1.5" />Übersicht</TabsTrigger>
          <TabsTrigger value="baustellen" className="rounded-lg text-sm"><MapPin className="h-3.5 w-3.5 mr-1.5" />Baustellen</TabsTrigger>
          <TabsTrigger value="positionen" className="rounded-lg text-sm"><FileText className="h-3.5 w-3.5 mr-1.5" />Positionen</TabsTrigger>
          <TabsTrigger value="kostenvergleich" className="rounded-lg text-sm"><BarChart2 className="h-3.5 w-3.5 mr-1.5" />Kostenvergleich</TabsTrigger>
          <TabsTrigger value="nachkalkulation" className="rounded-lg text-sm"><BarChart2 className="h-3.5 w-3.5 mr-1.5" />Nachkalkulation</TabsTrigger>
          <TabsTrigger value="team" className="rounded-lg text-sm"><UserCheck className="h-3.5 w-3.5 mr-1.5" />Team</TabsTrigger>
        </TabsList>

        <TabsContent value="uebersicht">
          <OrderOverviewTab order={order} financials={fin} budget={budget} orderValue={orderValue} />
        </TabsContent>
        <TabsContent value="baustellen">
          <OrderSiteCosts orderId={order.id} orderBudget={budget} siteCount={order.site_count ?? 0} />
        </TabsContent>
        <TabsContent value="positionen">
          <OrderItemsTab orderId={order.id} items={items} />
        </TabsContent>
        <TabsContent value="kostenvergleich">
          <OrderCostsTab orderId={order.id} costsByCategory={costsByCategory} />
        </TabsContent>
        <TabsContent value="nachkalkulation">
          <CostComparison financials={fin} orderValue={orderValue} />
        </TabsContent>
        <TabsContent value="team">
          <OrderTeamTab team={team} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
