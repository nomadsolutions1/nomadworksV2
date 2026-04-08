import { getCustomers } from "@/lib/actions/customers"
import { getOrders, getOrderItems } from "@/lib/actions/orders"
import { createClient } from "@/lib/supabase/server"
import { InvoiceNew } from "@/components/modules/invoices/invoice-new"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Rechnung erstellen" }

export default async function NeueRechnungPage() {
  const [{ data: customers = [] }, { data: ordersData = [] }] =
    await Promise.all([getCustomers(), getOrders()])

  const ordersWithItems = await Promise.all(
    ordersData.slice(0, 20).map(async (order) => {
      const { data: items = [] } = await getOrderItems(order.id)
      return {
        id: order.id,
        title: order.title,
        customer_id: order.customer_id,
        items: items.map((item) => ({
          position: item.position,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
        })),
      }
    })
  )

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let defaultTaxRate: number | null = 19
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (profile?.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("default_tax_rate")
        .eq("id", profile.company_id)
        .single()

      if (company?.default_tax_rate != null) {
        defaultTaxRate = company.default_tax_rate
      }
    }
  }

  return (
    <InvoiceNew
      customers={customers}
      orders={ordersWithItems}
      defaultTaxRate={defaultTaxRate}
    />
  )
}
