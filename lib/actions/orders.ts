"use server"

import { z } from "zod"
import { logActivity } from "@/lib/utils/activity-logger"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"
import { withAuth } from "@/lib/utils/auth-helper"
import type { SupabaseClient } from "@supabase/supabase-js"

// ─── Helpers ─────────────────────────────────────────────────

/** Verify that an order belongs to the given company before operating on sub-entities. */
async function verifyOrderOwnership(
  db: SupabaseClient,
  orderId: string,
  companyId: string
): Promise<boolean> {
  const { data } = await db
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("company_id", companyId)
    .single()
  return !!data
}

// ─── Types ────────────────────────────────────────────────────

export type OrderStatus =
  | "offer"
  | "commissioned"
  | "in_progress"
  | "acceptance"
  | "completed"
  | "complaint"

export type Order = {
  id: string
  company_id: string
  customer_id: string | null
  site_id: string | null
  title: string
  description: string | null
  status: OrderStatus
  start_date: string | null
  end_date: string | null
  budget: number | null
  original_budget: number | null
  change_order_notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined
  customer_name?: string | null
  site_count?: number
}

export type OrderSite = {
  id: string
  name: string
  status: string
  budget: number | null
  address: string | null
}

export type OrderItem = {
  id: string
  order_id: string
  position: number
  description: string
  unit: string
  quantity: number
  unit_price: number
  created_at: string
}

export type OrderCost = {
  id: string
  order_id: string
  company_id: string
  category: "personal" | "material" | "equipment" | "vehicles" | "subcontractor" | "other"
  description: string
  amount: number
  date: string
  created_at: string
}

export type OrderCostsByCategory = {
  category: string
  total: number
  items: OrderCost[]
}

export type OrderMeasurement = {
  id: string
  order_id: string | null
  company_id: string
  site_id: string | null
  description: string
  length: number | null
  width: number | null
  height: number | null
  calculated_value: number | null
  quantity: number
  unit: string
  measured_at: string
  measured_by: string
  notes: string | null
  created_at: string
}

export type OrderFinancials = {
  budget: number
  totalCosts: number
  margin: number
  marginPercent: number
  costsByCategory: Record<string, number>
  budgetUsedPercent: number
}

export type OrderTeamMember = {
  id: string
  name: string
  role: string
  hours: number
}

// ─── Schemas ──────────────────────────────────────────────────

const orderSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().optional(),
  customer_id: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
  status: z
    .enum(["offer", "commissioned", "in_progress", "acceptance", "completed", "complaint"])
    .default("offer"),
  budget: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null)),
  start_date: z.string().optional().transform((v) => v || null),
  end_date: z.string().optional().transform((v) => v || null),
})

const orderItemSchema = z.object({
  position: z.string().transform((v) => parseInt(v, 10)),
  description: z.string().min(1, "Beschreibung ist erforderlich"),
  unit: z.string().min(1, "Einheit ist erforderlich"),
  quantity: z.string().transform((v) => parseFloat(v.replace(",", "."))),
  unit_price: z.string().transform((v) => parseFloat(v.replace(",", "."))),
})

const orderCostSchema = z.object({
  category: z.enum(["personal", "material", "equipment", "vehicles", "subcontractor", "other"]),
  description: z.string().min(1, "Beschreibung ist erforderlich"),
  amount: z.string().transform((v) => parseFloat(v.replace(",", "."))),
  date: z.string().min(1, "Datum ist erforderlich"),
})

const measurementSchema = z.object({
  description: z.string().min(1, "Beschreibung ist erforderlich"),
  length: z.string().optional().transform((v) => (v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null)),
  width: z.string().optional().transform((v) => (v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null)),
  height: z.string().optional().transform((v) => (v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null)),
  unit: z.string().min(1, "Einheit ist erforderlich"),
  quantity: z.string().optional().transform((v) => (v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : 1)),
  notes: z.string().optional().transform((v) => v || null),
  site_id: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
})

const orderStatusSchema = z.enum([
  "offer", "commissioned", "in_progress", "acceptance", "completed", "complaint",
])

const changeOrderSchema = z.object({
  description: z.string().min(1, "Beschreibung ist erforderlich"),
  amount: z.number().positive("Betrag muss positiv sein"),
})

const budgetDistributionSchema = z.object({
  orderId: z.string().uuid(),
  distributions: z.array(z.object({
    siteId: z.string().uuid(),
    percentage: z.number().min(0).max(100),
  })),
})

// ─── Orders ───────────────────────────────────────────────────

export async function getOrders(): Promise<{ data?: Order[]; error?: string }> {
  return withAuth("auftraege", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("orders")
      .select(`*, customers (name)`)
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      trackError("orders", "getOrders", error.message, { table: "orders" })
      return { error: error.message }
    }

    // Count sites per order
    const orderIds = (data ?? []).map((r) => r.id)
    const { data: siteCounts } = orderIds.length > 0
      ? await db.from("construction_sites").select("order_id").in("order_id", orderIds).is("deleted_at", null)
      : { data: [] }

    const siteCountMap = new Map<string, number>()
    for (const s of siteCounts ?? []) {
      const oid = s.order_id as string
      siteCountMap.set(oid, (siteCountMap.get(oid) || 0) + 1)
    }

    const orders: Order[] = (data ?? []).map((row) => ({
      ...(row as unknown as Order),
      customer_name: (row.customers as { name: string } | null)?.name ?? null,
      site_count: siteCountMap.get(row.id) || 0,
    }))

    return { data: orders }
  }) as Promise<{ data?: Order[]; error?: string }>
}

export async function getOrder(id: string): Promise<{ data?: Order; error?: string }> {
  return withAuth("auftraege", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("orders")
      .select(`*, customers (name)`)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error) {
      trackError("orders", "getOrder", error.message, { table: "orders" })
      return { error: error.message }
    }

    const { count: siteCount } = await db.from("construction_sites")
      .select("id", { count: "exact", head: true })
      .eq("order_id", id)

    const order: Order = {
      ...(data as unknown as Order),
      customer_name: (data.customers as { name: string } | null)?.name ?? null,
      site_count: siteCount ?? 0,
    }

    return { data: order }
  }) as Promise<{ data?: Order; error?: string }>
}

export async function createOrder(
  formData: FormData
): Promise<{ success?: boolean; data?: Order; error?: string | Record<string, string[]> }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    const validated = orderSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const insertData = {
      company_id: profile.company_id,
      title: validated.data.title,
      description: validated.data.description || null,
      customer_id: validated.data.customer_id,
      status: validated.data.status,
      budget: validated.data.budget,
      start_date: validated.data.start_date,
      end_date: validated.data.end_date,
    }

    const { data, error } = await db
      .from("orders")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      trackError("orders", "createOrder", error.message, { table: "orders" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "order",
      entityId: data.id,
      title: `Auftrag "${validated.data.title}" angelegt`,
    })

    revalidatePath("/auftraege")
    return { success: true, data: data as unknown as Order }
  }) as Promise<{ success?: boolean; data?: Order; error?: string | Record<string, string[]> }>
}

export async function updateOrder(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    const validated = orderSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const updateData = {
      title: validated.data.title,
      description: validated.data.description || null,
      customer_id: validated.data.customer_id,
      status: validated.data.status,
      budget: validated.data.budget,
      start_date: validated.data.start_date,
      end_date: validated.data.end_date,
      updated_at: new Date().toISOString(),
    }

    const { error } = await db
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("orders", "updateOrder", error.message, { table: "orders" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "order",
      entityId: id,
      title: `Auftrag "${validated.data.title}" aktualisiert`,
    })

    revalidatePath("/auftraege")
    revalidatePath(`/auftraege/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    const statusValidation = orderStatusSchema.safeParse(status)
    if (!statusValidation.success) {
      return { error: "Ungültiger Status" }
    }

    const { error } = await db
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("orders", "updateOrderStatus", error.message, { table: "orders" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "order",
      entityId: id,
      title: `Auftragsstatus auf "${status}" geändert`,
    })

    revalidatePath("/auftraege")
    revalidatePath(`/auftraege/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function deleteOrder(id: string): Promise<{ success?: boolean; error?: string }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    if (profile.role !== "owner") {
      return { error: "Keine Berechtigung" }
    }

    // Soft delete
    const { error } = await db
      .from("orders")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("orders", "deleteOrder", error.message, { table: "orders" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "order",
      entityId: id,
      title: `Auftrag gelöscht`,
    })

    revalidatePath("/auftraege")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Order Sites ─────────────────────────────────────────────

export async function getOrderSites(orderId: string): Promise<{ data?: OrderSite[]; error?: string }> {
  return withAuth("auftraege", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("construction_sites")
      .select("id, name, status, budget, address")
      .eq("order_id", orderId)
      .eq("company_id", profile.company_id)
      .order("name", { ascending: true })

    if (error) {
      trackError("orders", "getOrderSites", error.message, { table: "construction_sites" })
      return { error: error.message }
    }
    return { data: (data as OrderSite[]) || [] }
  }) as Promise<{ data?: OrderSite[]; error?: string }>
}

export async function getAvailableBudget(orderId: string): Promise<{
  data?: { total: number; assigned: number; available: number }
  error?: string
}> {
  return withAuth("auftraege", "read", async ({ profile, db }) => {
    const { data: order } = await db.from("orders").select("budget")
      .eq("id", orderId).eq("company_id", profile.company_id).single()
    if (!order) return { error: "Auftrag nicht gefunden" }

    const total = order.budget ?? 0

    const { data: sites } = await db.from("construction_sites")
      .select("budget").eq("order_id", orderId).eq("company_id", profile.company_id)
    const assigned = (sites ?? []).reduce((s, site) => s + (Number(site.budget) || 0), 0)

    return { data: { total, assigned, available: total - assigned } }
  }) as Promise<{ data?: { total: number; assigned: number; available: number }; error?: string }>
}

// ─── Budget Distribution (NEU) ───────────────────────────────

export async function updateBudgetDistribution(
  orderId: string,
  distributions: { siteId: string; percentage: number }[]
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    // Validate input
    const validated = budgetDistributionSchema.safeParse({ orderId, distributions })
    if (!validated.success) return { error: "Ungültige Eingabe" }

    // Validate: sum of percentages must equal 100
    const totalPercent = distributions.reduce((sum, d) => sum + d.percentage, 0)
    if (Math.abs(totalPercent - 100) > 0.01) {
      return { error: `Summe der Prozente muss 100% ergeben (aktuell: ${totalPercent}%)` }
    }

    // Get order budget
    const { data: order } = await db.from("orders")
      .select("budget")
      .eq("id", orderId)
      .eq("company_id", profile.company_id)
      .single()

    if (!order) return { error: "Auftrag nicht gefunden" }
    const totalBudget = order.budget ?? 0

    if (totalBudget <= 0) {
      return { error: "Auftrag hat kein Budget" }
    }

    // Update each site's budget
    for (const dist of distributions) {
      const siteBudget = Math.round((totalBudget * dist.percentage / 100) * 100) / 100

      const { error } = await db.from("construction_sites")
        .update({ budget: siteBudget, updated_at: new Date().toISOString() })
        .eq("id", dist.siteId)
        .eq("order_id", orderId)
        .eq("company_id", profile.company_id)

      if (error) {
        trackError("orders", "updateBudgetDistribution", error.message, { table: "construction_sites", siteId: dist.siteId })
        return { error: error.message }
      }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "order",
      entityId: orderId,
      title: `Budget auf ${distributions.length} Baustellen verteilt`,
    })

    revalidatePath(`/auftraege/${orderId}`)
    revalidatePath("/baustellen")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── addChangeOrder (Nachträge) ──────────────────────────────

export async function addChangeOrder(
  orderId: string,
  description: string,
  amount: number
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    const changeValidation = changeOrderSchema.safeParse({ description, amount })
    if (!changeValidation.success) {
      return { error: "Ungültige Eingabe: Beschreibung und positiver Betrag erforderlich" }
    }

    const { data: order } = await db.from("orders")
      .select("budget, original_budget, change_order_notes")
      .eq("id", orderId)
      .eq("company_id", profile.company_id)
      .single()

    if (!order) return { error: "Auftrag nicht gefunden" }

    const currentBudget = order.budget ?? 0
    const originalBudget = order.original_budget ?? currentBudget
    const existingNotes = order.change_order_notes ?? ""

    const dateStr = new Date().toLocaleDateString("de-DE")
    const newNote = `[${dateStr}]: ${description} (+${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount)})`
    const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote

    // original_budget and change_order_notes exist in DB but not in strict Update type
    // Using type assertion until types are regenerated
    const updatePayload: Record<string, unknown> = {
      budget: currentBudget + amount,
      original_budget: originalBudget,
      change_order_notes: updatedNotes,
    }
    const { error } = await (db.from("orders") as ReturnType<typeof db.from>).update(updatePayload as never).eq("id", orderId).eq("company_id", profile.company_id)

    if (error) {
      trackError("orders", "addChangeOrder", error.message, { table: "orders" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "order",
      entityId: orderId,
      title: `Nachtrag: ${description} (+${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount)})`,
    })

    revalidatePath(`/auftraege/${orderId}`)
    revalidatePath("/auftraege")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Order Items ──────────────────────────────────────────────

export async function getOrderItems(
  orderId: string
): Promise<{ data?: OrderItem[]; error?: string }> {
  return withAuth("auftraege", "read", async ({ profile, db }) => {
    if (!(await verifyOrderOwnership(db, orderId, profile.company_id))) {
      return { error: "Auftrag nicht gefunden" }
    }

    const { data, error } = await db
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("position", { ascending: true })

    if (error) {
      trackError("orders", "getOrderItems", error.message, { table: "order_items" })
      return { error: error.message }
    }
    return { data: data as OrderItem[] }
  }) as Promise<{ data?: OrderItem[]; error?: string }>
}

export async function addOrderItem(
  orderId: string,
  formData: FormData
): Promise<{ success?: boolean; data?: OrderItem; error?: string | Record<string, string[]> }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    const validated = orderItemSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const insertData = {
      order_id: orderId,
      position: validated.data.position,
      description: validated.data.description,
      unit: validated.data.unit,
      quantity: validated.data.quantity,
      unit_price: validated.data.unit_price,
    }

    const { data, error } = await db
      .from("order_items")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      trackError("orders", "addOrderItem", error.message, { table: "order_items" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "order_item",
      entityId: (data as { id: string }).id,
      title: `Position "${validated.data.description}" hinzugefügt`,
    })

    revalidatePath(`/auftraege/${orderId}`)
    return { success: true, data: data as OrderItem }
  }) as Promise<{ success?: boolean; data?: OrderItem; error?: string | Record<string, string[]> }>
}

// ─── updateOrderItem (NEU — Positionen editierbar) ───────────

export async function updateOrderItem(
  itemId: string,
  orderId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    if (!(await verifyOrderOwnership(db, orderId, profile.company_id))) {
      return { error: "Auftrag nicht gefunden" }
    }

    const validated = orderItemSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const updateData = {
      position: validated.data.position,
      description: validated.data.description,
      unit: validated.data.unit,
      quantity: validated.data.quantity,
      unit_price: validated.data.unit_price,
    }

    const { error } = await db
      .from("order_items")
      .update(updateData)
      .eq("id", itemId)
      .eq("order_id", orderId)

    if (error) {
      trackError("orders", "updateOrderItem", error.message, { table: "order_items" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "order_item",
      entityId: itemId,
      title: `Position "${validated.data.description}" aktualisiert`,
    })

    revalidatePath(`/auftraege/${orderId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function deleteOrderItem(
  itemId: string,
  orderId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    if (!(await verifyOrderOwnership(db, orderId, profile.company_id))) {
      return { error: "Auftrag nicht gefunden" }
    }

    const { error } = await db
      .from("order_items")
      .delete()
      .eq("id", itemId)
      .eq("order_id", orderId)

    if (error) {
      trackError("orders", "deleteOrderItem", error.message, { table: "order_items" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "order_item",
      entityId: itemId,
      title: `Position gelöscht`,
    })

    revalidatePath(`/auftraege/${orderId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Order Costs ──────────────────────────────────────────────

export async function getOrderCosts(
  orderId: string
): Promise<{ data?: OrderCostsByCategory[]; error?: string }> {
  return withAuth("auftraege", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("order_costs")
      .select("*")
      .eq("order_id", orderId)
      .eq("company_id", profile.company_id)
      .order("date", { ascending: false })

    if (error) {
      trackError("orders", "getOrderCosts", error.message, { table: "order_costs" })
      return { error: error.message }
    }

    const costs = (data as OrderCost[]) || []

    // Group by category
    const grouped: Record<string, { total: number; items: OrderCost[] }> = {}
    const categories = ["personal", "material", "equipment", "vehicles", "subcontractor", "other"]

    for (const cat of categories) {
      grouped[cat] = { total: 0, items: [] }
    }

    for (const cost of costs) {
      const cat = cost.category || "other"
      if (!grouped[cat]) grouped[cat] = { total: 0, items: [] }
      grouped[cat].total += cost.amount
      grouped[cat].items.push(cost)
    }

    const result: OrderCostsByCategory[] = Object.entries(grouped)
      .filter(([, v]) => v.items.length > 0)
      .map(([category, v]) => ({ category, total: v.total, items: v.items }))

    return { data: result }
  }) as Promise<{ data?: OrderCostsByCategory[]; error?: string }>
}

export async function addOrderCost(
  orderId: string,
  formData: FormData
): Promise<{ success?: boolean; data?: OrderCost; error?: string | Record<string, string[]> }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    const validated = orderCostSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const insertData = {
      order_id: orderId,
      company_id: profile.company_id,
      category: validated.data.category,
      description: validated.data.description,
      amount: validated.data.amount,
      date: validated.data.date,
    }

    const { data, error } = await db
      .from("order_costs")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      trackError("orders", "addOrderCost", error.message, { table: "order_costs" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "order_cost",
      entityId: (data as { id: string }).id,
      title: `Kosten "${validated.data.description}" hinzugefügt`,
    })

    revalidatePath(`/auftraege/${orderId}`)
    return { success: true, data: data as OrderCost }
  }) as Promise<{ success?: boolean; data?: OrderCost; error?: string | Record<string, string[]> }>
}

export async function deleteOrderCost(
  costId: string,
  orderId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    if (!(await verifyOrderOwnership(db, orderId, profile.company_id))) {
      return { error: "Auftrag nicht gefunden" }
    }

    const { error } = await db
      .from("order_costs")
      .delete()
      .eq("id", costId)
      .eq("order_id", orderId)

    if (error) {
      trackError("orders", "deleteOrderCost", error.message, { table: "order_costs" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "order_cost",
      entityId: costId,
      title: `Kosten gelöscht`,
    })

    revalidatePath(`/auftraege/${orderId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Order Measurements ───────────────────────────────────────

export async function getOrderMeasurements(
  orderId: string
): Promise<{ data?: OrderMeasurement[]; error?: string }> {
  return withAuth("auftraege", "read", async ({ profile, db }) => {
    if (!(await verifyOrderOwnership(db, orderId, profile.company_id))) {
      return { error: "Auftrag nicht gefunden" }
    }

    const { data, error } = await db
      .from("measurements")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })

    if (error) {
      trackError("orders", "getOrderMeasurements", error.message, { table: "measurements" })
      return { error: error.message }
    }
    return { data: data as OrderMeasurement[] }
  }) as Promise<{ data?: OrderMeasurement[]; error?: string }>
}

export async function addMeasurement(
  orderId: string,
  formData: FormData
): Promise<{ success?: boolean; data?: OrderMeasurement; error?: string | Record<string, string[]> }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    const validated = measurementSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    const { length, width, height, unit, quantity, notes, site_id } = validated.data

    const insertData = {
      order_id: orderId,
      company_id: profile.company_id,
      measured_by: user.id,
      description: validated.data.description,
      length, width, height, unit, quantity, notes, site_id,
    }

    const { data, error } = await db
      .from("measurements")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      trackError("orders", "addMeasurement", error.message, { table: "measurements" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "measurement",
      entityId: (data as { id: string }).id,
      title: `Aufmaß "${validated.data.description}" hinzugefügt`,
    })

    revalidatePath(`/auftraege/${orderId}`)
    return { success: true, data: data as OrderMeasurement }
  }) as Promise<{ success?: boolean; data?: OrderMeasurement; error?: string | Record<string, string[]> }>
}

export async function deleteMeasurement(
  measurementId: string,
  orderId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    if (!(await verifyOrderOwnership(db, orderId, profile.company_id))) {
      return { error: "Auftrag nicht gefunden" }
    }

    const { error } = await db
      .from("measurements")
      .delete()
      .eq("id", measurementId)
      .eq("order_id", orderId)

    if (error) {
      trackError("orders", "deleteMeasurement", error.message, { table: "measurements" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "measurement",
      entityId: measurementId,
      title: `Aufmaß gelöscht`,
    })

    revalidatePath(`/auftraege/${orderId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Order Financials ─────────────────────────────────────────

export async function getOrderFinancials(
  orderId: string
): Promise<{ data?: OrderFinancials; error?: string }> {
  return withAuth("auftraege", "read", async ({ profile, db }) => {
    const [orderRes, costsRes, itemsRes] = await Promise.all([
      db.from("orders").select("budget")
        .eq("id", orderId).eq("company_id", profile.company_id).single(),
      db.from("order_costs").select("category, amount")
        .eq("order_id", orderId).eq("company_id", profile.company_id),
      db.from("order_items").select("quantity, unit_price").eq("order_id", orderId),
    ])

    if (orderRes.error) {
      trackError("orders", "getOrderFinancials", orderRes.error.message, { table: "orders" })
      return { error: orderRes.error.message }
    }

    const budget = orderRes.data?.budget as number | null
    const items = itemsRes.data ?? []
    const costs = costsRes.data ?? []

    // Order value from items
    const orderValue = items.reduce(
      (sum, i) => sum + (i.quantity ?? 0) * (i.unit_price ?? 0), 0
    )
    const budgetValue = budget ?? orderValue

    // Costs by category
    const costsByCategory: Record<string, number> = {
      personal: 0, material: 0, equipment: 0, vehicles: 0, subcontractor: 0, other: 0,
    }

    for (const cost of costs) {
      const cat = (cost.category as string) || "other"
      costsByCategory[cat] = (costsByCategory[cat] || 0) + (cost.amount ?? 0)
    }

    const totalCosts = Object.values(costsByCategory).reduce((a, b) => a + b, 0)
    const margin = budgetValue - totalCosts
    const marginPercent = budgetValue > 0 ? (margin / budgetValue) * 100 : 0
    const budgetUsedPercent = budgetValue > 0 ? (totalCosts / budgetValue) * 100 : 0

    return {
      data: { budget: budgetValue, totalCosts, margin, marginPercent, costsByCategory, budgetUsedPercent },
    }
  }) as Promise<{ data?: OrderFinancials; error?: string }>
}

// ─── Order Team ───────────────────────────────────────────────

export async function getOrderTeam(
  orderId: string
): Promise<{ data?: OrderTeamMember[]; error?: string }> {
  return withAuth("auftraege", "read", async ({ profile, db }) => {
    if (!(await verifyOrderOwnership(db, orderId, profile.company_id))) {
      return { error: "Auftrag nicht gefunden" }
    }

    const { data, error } = await db
      .from("order_assignments")
      .select("resource_id, resource_type")
      .eq("order_id", orderId)

    if (error) return { data: [] }

    const userIds = (data ?? [])
      .filter((a) => a.resource_type === "employee")
      .map((a) => a.resource_id)

    if (userIds.length === 0) return { data: [] }

    const { data: profiles } = await db
      .from("profiles")
      .select("id, first_name, last_name, role")
      .in("id", userIds)
      .eq("company_id", profile.company_id)

    const team: OrderTeamMember[] = (profiles ?? []).map((prof) => ({
      id: prof.id,
      name: `${prof.first_name} ${prof.last_name}`,
      role: prof.role ?? "",
      hours: 0,
    }))

    return { data: team }
  }) as Promise<{ data?: OrderTeamMember[]; error?: string }>
}
