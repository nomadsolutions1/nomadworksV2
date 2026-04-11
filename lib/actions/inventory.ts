"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { withAuth } from "@/lib/utils/auth-helper"
import { trackError } from "@/lib/utils/error-tracker"
import { logActivity } from "@/lib/utils/activity-logger"
import type { Database } from "@/lib/types/database"

// ─── DB Row shortcuts ────────────────────────────────────────
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"]
type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"]
type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"]
type PurchaseOrderItemRow = Database["public"]["Tables"]["purchase_order_items"]["Row"]
type StockMovementRow = Database["public"]["Tables"]["stock_movements"]["Row"]
type MaterialBundleRow = Database["public"]["Tables"]["material_bundles"]["Row"]
type MaterialBundleItemRow = Database["public"]["Tables"]["material_bundle_items"]["Row"]

// ─── Public Types ────────────────────────────────────────────

export type Material = MaterialRow & { supplier_name: string | null }
export type Supplier = SupplierRow
export type PurchaseOrder = PurchaseOrderRow & { supplier_name: string | null }
export type PurchaseOrderItem = PurchaseOrderItemRow & {
  material_name: string | null
  material_unit: string | null
}
export type InventoryMovement = StockMovementRow & {
  material_name: string | null
  site_name: string | null
  created_by_name: string | null
}
export type Bundle = MaterialBundleRow
export type BundleItem = MaterialBundleItemRow & {
  material_name: string | null
  material_unit: string | null
}

export type InventoryStats = {
  totalMaterials: number
  belowMinStock: number
  openOrders: number
  stockValue: number
}

// ─── Zod Schemas ─────────────────────────────────────────────

const decimalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null))

const requiredDecimal = z
  .string()
  .min(1, "Wert erforderlich")
  .transform((v) => parseFloat(v.replace(",", ".")))

const materialSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  article_number: z.string().optional().transform((v) => v || null),
  unit: z.string().min(1, "Einheit ist erforderlich"),
  category: z.string().min(1, "Kategorie ist erforderlich"),
  price_per_unit: decimalString,
  supplier_id: z.string().optional().transform((v) => (v && v.trim() !== "" ? v : null)),
  min_stock: decimalString,
  current_stock: decimalString,
})

const supplierSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  contact_person: z.string().optional().transform((v) => v || null),
  email: z
    .string()
    .email("Ungültige E-Mail-Adresse")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  phone: z.string().optional().transform((v) => v || null),
  address: z.string().optional().transform((v) => v || null),
  rating: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? parseInt(v, 10) : null)),
  notes: z.string().optional().transform((v) => v || null),
})

const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, "Lieferant ist erforderlich"),
  order_date: z.string().min(1, "Bestelldatum ist erforderlich"),
  order_id: z.string().optional().transform((v) => (v && v.trim() !== "" ? v : null)),
  notes: z.string().optional().transform((v) => v || null),
})

const purchaseOrderItemSchema = z.object({
  material_id: z.string().min(1, "Material ist erforderlich"),
  quantity: requiredDecimal,
  unit_price: requiredDecimal,
})

const movementSchema = z
  .object({
    material_id: z.string().min(1, "Material ist erforderlich"),
    type: z.enum(["in", "out", "return"]),
    quantity: requiredDecimal,
    site_id: z.string().optional().transform((v) => (v && v.trim() !== "" ? v : null)),
    order_id: z.string().optional().transform((v) => (v && v.trim() !== "" ? v : null)),
    notes: z.string().optional().transform((v) => v || null),
  })
  .refine(
    (data) => data.type !== "out" || (data.site_id !== null && data.site_id !== undefined),
    { message: "Baustelle ist bei Entnahmen erforderlich", path: ["site_id"] }
  )

const bundleSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional().transform((v) => v || null),
})

const bundleItemSchema = z.object({
  material_id: z.string().min(1, "Material ist erforderlich"),
  quantity: requiredDecimal,
})

// ─── Helper: sensitive data filter for Foreman ───────────────
// Owner + Foreman/Accountant mit can_view_sensitive_data sehen Preise.
// Sonstige Foreman sehen Materialien ohne price_per_unit.
function canSeePrices(profile: { role: string; can_view_sensitive_data?: boolean }): boolean {
  if (profile.role === "owner" || profile.role === "super_admin") return true
  if (
    (profile.role === "foreman" || profile.role === "accountant" || profile.role === "office") &&
    profile.can_view_sensitive_data
  ) {
    return true
  }
  return false
}

function stripPrices<T extends { price_per_unit: number | null }>(row: T): T {
  return { ...row, price_per_unit: null }
}

// ─── Materials ────────────────────────────────────────────────

export async function listMaterials(): Promise<{ data?: Material[]; error?: string }> {
  return withAuth("lager", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("materials")
      .select("*, suppliers(name)")
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .order("name", { ascending: true })

    if (error) {
      trackError("inventory", "listMaterials", error.message, { table: "materials" })
      return { error: error.message }
    }

    const showPrices = canSeePrices(profile)
    const materials: Material[] = (data ?? []).map((row) => {
      const { suppliers, ...rest } = row as MaterialRow & {
        suppliers: { name: string } | null
      }
      const base: Material = {
        ...(rest as MaterialRow),
        supplier_name: suppliers?.name ?? null,
      }
      return showPrices ? base : stripPrices(base)
    })

    return { data: materials }
  }) as Promise<{ data?: Material[]; error?: string }>
}

export async function getMaterial(id: string): Promise<{ data?: Material; error?: string }> {
  return withAuth("lager", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("materials")
      .select("*, suppliers(name)")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .single()

    if (error || !data) {
      trackError("inventory", "getMaterial", error?.message ?? "not found", { table: "materials" })
      return { error: "Material nicht gefunden" }
    }

    const { suppliers, ...rest } = data as MaterialRow & {
      suppliers: { name: string } | null
    }
    const material: Material = {
      ...(rest as MaterialRow),
      supplier_name: suppliers?.name ?? null,
    }

    return { data: canSeePrices(profile) ? material : stripPrices(material) }
  }) as Promise<{ data?: Material; error?: string }>
}

export async function createMaterial(
  formData: FormData
): Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }> {
  return withAuth("lager", "write", async ({ user, profile, db }) => {
    const validated = materialSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { data, error } = await db
      .from("materials")
      .insert({
        company_id: profile.company_id,
        name: v.name,
        article_number: v.article_number,
        unit: v.unit,
        category: v.category,
        price_per_unit: v.price_per_unit,
        supplier_id: v.supplier_id,
        min_stock: v.min_stock,
        current_stock: v.current_stock ?? 0,
      })
      .select("id")
      .single()

    if (error || !data) {
      trackError("inventory", "createMaterial", error?.message ?? "insert failed", { table: "materials" })
      return { error: "Material konnte nicht angelegt werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "material",
      entityId: data.id,
      title: `Material "${v.name}" angelegt`,
    })

    revalidatePath("/lager")
    revalidatePath("/lager/materialien")
    return { success: true, id: data.id }
  }) as Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }>
}

export async function updateMaterial(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("lager", "write", async ({ user, profile, db }) => {
    const validated = materialSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { error } = await db
      .from("materials")
      .update({
        name: v.name,
        article_number: v.article_number,
        unit: v.unit,
        category: v.category,
        price_per_unit: v.price_per_unit,
        supplier_id: v.supplier_id,
        min_stock: v.min_stock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("inventory", "updateMaterial", error.message, { table: "materials" })
      return { error: "Änderungen konnten nicht gespeichert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "material",
      entityId: id,
      title: `Material "${v.name}" aktualisiert`,
    })

    revalidatePath("/lager")
    revalidatePath(`/lager/materialien/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function deleteMaterial(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("lager", "write", async ({ user, profile, db }) => {
    if (profile.role !== "owner") return { error: "Keine Berechtigung" }

    const { data: material } = await db
      .from("materials")
      .select("name")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    const { error } = await db
      .from("materials")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("inventory", "deleteMaterial", error.message, { table: "materials" })
      return { error: "Material konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "material",
      entityId: id,
      title: material ? `Material "${material.name}" gelöscht` : "Material gelöscht",
    })

    revalidatePath("/lager")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Stock Movements ─────────────────────────────────────────

export async function listStockMovements(
  materialId?: string
): Promise<{ data?: InventoryMovement[]; error?: string }> {
  return withAuth("lager", "read", async ({ profile, db }) => {
    let query = db
      .from("stock_movements")
      .select("*, materials(name), construction_sites(name), profiles(first_name, last_name)")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })

    if (materialId) query = query.eq("material_id", materialId)

    const { data, error } = await query

    if (error) {
      trackError("inventory", "listStockMovements", error.message, { table: "stock_movements" })
      return { error: error.message }
    }

    const showPrices = canSeePrices(profile)
    const movements: InventoryMovement[] = (data ?? []).map((row) => {
      const typed = row as StockMovementRow & {
        materials: { name: string } | null
        construction_sites: { name: string } | null
        profiles: { first_name: string; last_name: string } | null
      }
      return {
        ...(typed as StockMovementRow),
        unit_price: showPrices ? typed.unit_price : null,
        material_name: typed.materials?.name ?? null,
        site_name: typed.construction_sites?.name ?? null,
        created_by_name: typed.profiles
          ? `${typed.profiles.first_name} ${typed.profiles.last_name}`
          : null,
      }
    })

    return { data: movements }
  }) as Promise<{ data?: InventoryMovement[]; error?: string }>
}

export async function createStockMovement(
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("lager", "write", async ({ user, profile, db }) => {
    const validated = movementSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data

    // Load material for stock calc + activity log
    const { data: mat, error: matError } = await db
      .from("materials")
      .select("id, name, current_stock")
      .eq("id", v.material_id)
      .eq("company_id", profile.company_id)
      .single()

    if (matError || !mat) {
      trackError("inventory", "createStockMovement", matError?.message ?? "material not found", {
        table: "materials",
      })
      return { error: "Material nicht gefunden" }
    }

    const current = mat.current_stock ?? 0
    let newStock = current
    if (v.type === "in" || v.type === "return") {
      newStock = current + v.quantity
    } else if (v.type === "out") {
      newStock = current - v.quantity
      if (newStock < 0) {
        return { error: `Nicht genügend Bestand. Verfügbar: ${current}` }
      }
    }

    const { error: moveError } = await db.from("stock_movements").insert({
      company_id: profile.company_id,
      material_id: v.material_id,
      type: v.type,
      quantity: v.quantity,
      site_id: v.site_id,
      order_id: v.order_id,
      notes: v.notes,
      created_by: user.id,
    })

    if (moveError) {
      trackError("inventory", "createStockMovement", moveError.message, { table: "stock_movements" })
      return { error: "Bewegung konnte nicht gebucht werden" }
    }

    const { error: updateError } = await db
      .from("materials")
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", v.material_id)
      .eq("company_id", profile.company_id)

    if (updateError) {
      trackError("inventory", "createStockMovement.update", updateError.message, { table: "materials" })
      // Best-effort: movement is already logged; do not roll back
    }

    const actionLabel = v.type === "in" ? "Eingang" : v.type === "out" ? "Ausgang" : "Rückgabe"
    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "stock_movement",
      title: `${actionLabel}: ${v.quantity} × ${mat.name}`,
    })

    revalidatePath("/lager")
    revalidatePath(`/lager/materialien/${v.material_id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

// ─── Suppliers ───────────────────────────────────────────────

export async function listSuppliers(): Promise<{ data?: Supplier[]; error?: string }> {
  return withAuth("lager", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("suppliers")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("name", { ascending: true })

    if (error) {
      trackError("inventory", "listSuppliers", error.message, { table: "suppliers" })
      return { error: error.message }
    }
    return { data: (data ?? []) as Supplier[] }
  }) as Promise<{ data?: Supplier[]; error?: string }>
}

export async function getSupplier(id: string): Promise<{ data?: Supplier; error?: string }> {
  return withAuth("lager", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error || !data) {
      trackError("inventory", "getSupplier", error?.message ?? "not found", { table: "suppliers" })
      return { error: "Lieferant nicht gefunden" }
    }
    return { data: data as Supplier }
  }) as Promise<{ data?: Supplier; error?: string }>
}

export async function createSupplier(
  formData: FormData
): Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }> {
  return withAuth("lager", "write", async ({ user, profile, db }) => {
    const validated = supplierSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { data, error } = await db
      .from("suppliers")
      .insert({
        company_id: profile.company_id,
        name: v.name,
        contact_person: v.contact_person,
        email: v.email,
        phone: v.phone,
        address: v.address,
        rating: v.rating,
        notes: v.notes,
      })
      .select("id")
      .single()

    if (error || !data) {
      trackError("inventory", "createSupplier", error?.message ?? "insert failed", { table: "suppliers" })
      return { error: "Lieferant konnte nicht angelegt werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "supplier",
      entityId: data.id,
      title: `Lieferant "${v.name}" angelegt`,
    })

    revalidatePath("/lager")
    revalidatePath("/lager/lieferanten")
    return { success: true, id: data.id }
  }) as Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }>
}

export async function updateSupplier(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("lager", "write", async ({ user, profile, db }) => {
    const validated = supplierSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { error } = await db
      .from("suppliers")
      .update({
        name: v.name,
        contact_person: v.contact_person,
        email: v.email,
        phone: v.phone,
        address: v.address,
        rating: v.rating,
        notes: v.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("inventory", "updateSupplier", error.message, { table: "suppliers" })
      return { error: "Änderungen konnten nicht gespeichert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "supplier",
      entityId: id,
      title: `Lieferant "${v.name}" aktualisiert`,
    })

    revalidatePath("/lager/lieferanten")
    revalidatePath(`/lager/lieferanten/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function deleteSupplier(id: string): Promise<{ success?: boolean; error?: string }> {
  return withAuth("lager", "write", async ({ user, profile, db }) => {
    if (profile.role !== "owner") return { error: "Keine Berechtigung" }

    const { data: supplier } = await db
      .from("suppliers")
      .select("name")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    const { error } = await db
      .from("suppliers")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("inventory", "deleteSupplier", error.message, { table: "suppliers" })
      return { error: "Lieferant konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "supplier",
      entityId: id,
      title: supplier ? `Lieferant "${supplier.name}" gelöscht` : "Lieferant gelöscht",
    })

    revalidatePath("/lager/lieferanten")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Purchase Orders ─────────────────────────────────────────

export async function listPurchaseOrders(): Promise<{ data?: PurchaseOrder[]; error?: string }> {
  return withAuth("lager", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("purchase_orders")
      .select("*, suppliers(name)")
      .eq("company_id", profile.company_id)
      .order("order_date", { ascending: false })

    if (error) {
      trackError("inventory", "listPurchaseOrders", error.message, { table: "purchase_orders" })
      return { error: error.message }
    }

    const showPrices = canSeePrices(profile)
    const orders: PurchaseOrder[] = (data ?? []).map((row) => {
      const typed = row as PurchaseOrderRow & { suppliers: { name: string } | null }
      const { suppliers, ...rest } = typed
      return {
        ...(rest as PurchaseOrderRow),
        total_amount: showPrices ? rest.total_amount : null,
        supplier_name: suppliers?.name ?? null,
      }
    })

    return { data: orders }
  }) as Promise<{ data?: PurchaseOrder[]; error?: string }>
}

export async function getPurchaseOrder(
  id: string
): Promise<{ data?: PurchaseOrder; error?: string }> {
  return withAuth("lager", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("purchase_orders")
      .select("*, suppliers(name)")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error || !data) {
      trackError("inventory", "getPurchaseOrder", error?.message ?? "not found", {
        table: "purchase_orders",
      })
      return { error: "Bestellung nicht gefunden" }
    }

    const typed = data as PurchaseOrderRow & { suppliers: { name: string } | null }
    const { suppliers, ...rest } = typed
    const order: PurchaseOrder = {
      ...(rest as PurchaseOrderRow),
      total_amount: canSeePrices(profile) ? rest.total_amount : null,
      supplier_name: suppliers?.name ?? null,
    }
    return { data: order }
  }) as Promise<{ data?: PurchaseOrder; error?: string }>
}

export async function createPurchaseOrder(
  formData: FormData
): Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }> {
  return withAuth("lager", "write", async ({ user, profile, db }) => {
    const validated = purchaseOrderSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { data, error } = await db
      .from("purchase_orders")
      .insert({
        company_id: profile.company_id,
        supplier_id: v.supplier_id,
        status: "draft",
        order_date: v.order_date,
        order_id: v.order_id,
        notes: v.notes,
      })
      .select("id")
      .single()

    if (error || !data) {
      trackError("inventory", "createPurchaseOrder", error?.message ?? "insert failed", {
        table: "purchase_orders",
      })
      return { error: "Bestellung konnte nicht angelegt werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "purchase_order",
      entityId: data.id,
      title: `Bestellung #${data.id.slice(0, 8)} angelegt`,
    })

    revalidatePath("/lager")
    revalidatePath("/lager/bestellungen")
    return { success: true, id: data.id }
  }) as Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }>
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: "draft" | "ordered" | "partially_delivered" | "delivered" | "cancelled"
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("lager", "write", async ({ user, profile, db }) => {
    const { error } = await db
      .from("purchase_orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("inventory", "updatePurchaseOrderStatus", error.message, { table: "purchase_orders" })
      return { error: "Status konnte nicht aktualisiert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "purchase_order",
      entityId: id,
      title: `Bestellstatus → ${status}`,
    })

    revalidatePath("/lager")
    revalidatePath(`/lager/bestellungen/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function markPurchaseOrderReceived(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  return updatePurchaseOrderStatus(id, "delivered")
}

// ─── Purchase Order Items ────────────────────────────────────

export async function listPurchaseOrderItems(
  orderId: string
): Promise<{ data?: PurchaseOrderItem[]; error?: string }> {
  return withAuth("lager", "read", async ({ profile, db }) => {
    // Verify order belongs to company first
    const { data: order } = await db
      .from("purchase_orders")
      .select("id")
      .eq("id", orderId)
      .eq("company_id", profile.company_id)
      .single()

    if (!order) return { error: "Bestellung nicht gefunden" }

    const { data, error } = await db
      .from("purchase_order_items")
      .select("*, materials(name, unit)")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })

    if (error) {
      trackError("inventory", "listPurchaseOrderItems", error.message, {
        table: "purchase_order_items",
      })
      return { error: error.message }
    }

    const showPrices = canSeePrices(profile)
    const items: PurchaseOrderItem[] = (data ?? []).map((row) => {
      const typed = row as PurchaseOrderItemRow & {
        materials: { name: string; unit: string } | null
      }
      const { materials, ...rest } = typed
      return {
        ...(rest as PurchaseOrderItemRow),
        unit_price: showPrices ? rest.unit_price : 0,
        material_name: materials?.name ?? null,
        material_unit: materials?.unit ?? null,
      }
    })

    return { data: items }
  }) as Promise<{ data?: PurchaseOrderItem[]; error?: string }>
}

export async function addPurchaseOrderItem(
  orderId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("lager", "write", async ({ profile, db }) => {
    const validated = purchaseOrderItemSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    // Verify order belongs to company
    const { data: order } = await db
      .from("purchase_orders")
      .select("id")
      .eq("id", orderId)
      .eq("company_id", profile.company_id)
      .single()

    if (!order) return { error: "Bestellung nicht gefunden" }

    const v = validated.data
    const { error } = await db.from("purchase_order_items").insert({
      order_id: orderId,
      material_id: v.material_id,
      quantity: v.quantity,
      delivered_quantity: 0,
      unit_price: v.unit_price,
    })

    if (error) {
      trackError("inventory", "addPurchaseOrderItem", error.message, {
        table: "purchase_order_items",
      })
      return { error: "Position konnte nicht hinzugefügt werden" }
    }

    // Recalculate order total
    const { data: allItems } = await db
      .from("purchase_order_items")
      .select("quantity, unit_price")
      .eq("order_id", orderId)

    if (allItems) {
      const newTotal = allItems.reduce(
        (sum, i) => sum + (i.quantity ?? 0) * (i.unit_price ?? 0),
        0
      )
      await db
        .from("purchase_orders")
        .update({ total_amount: newTotal, updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("company_id", profile.company_id)
    }

    revalidatePath(`/lager/bestellungen/${orderId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function updatePurchaseOrderItemDelivery(
  itemId: string,
  orderId: string,
  quantity: number
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("lager", "write", async ({ profile, db }) => {
    if (!Number.isFinite(quantity) || quantity < 0) {
      return { error: "Ungültige Menge" }
    }

    // Verify order belongs to company (defense in depth — items aren't company-scoped directly)
    const { data: order } = await db
      .from("purchase_orders")
      .select("id")
      .eq("id", orderId)
      .eq("company_id", profile.company_id)
      .single()

    if (!order) return { error: "Bestellung nicht gefunden" }

    const { error } = await db
      .from("purchase_order_items")
      .update({ delivered_quantity: quantity })
      .eq("id", itemId)
      .eq("order_id", orderId)

    if (error) {
      trackError("inventory", "updatePurchaseOrderItemDelivery", error.message, {
        table: "purchase_order_items",
      })
      return { error: "Liefermenge konnte nicht aktualisiert werden" }
    }

    // Recompute order status
    const { data: items } = await db
      .from("purchase_order_items")
      .select("quantity, delivered_quantity")
      .eq("order_id", orderId)

    if (items) {
      const allDelivered = items.every((i) => (i.delivered_quantity ?? 0) >= (i.quantity ?? 0))
      const anyDelivered = items.some((i) => (i.delivered_quantity ?? 0) > 0)
      let newStatus: "ordered" | "partially_delivered" | "delivered" = "ordered"
      if (allDelivered) newStatus = "delivered"
      else if (anyDelivered) newStatus = "partially_delivered"

      await db
        .from("purchase_orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("company_id", profile.company_id)
    }

    revalidatePath(`/lager/bestellungen/${orderId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Material Bundles ────────────────────────────────────────

export async function listMaterialBundles(): Promise<{ data?: Bundle[]; error?: string }> {
  return withAuth("lager", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("material_bundles")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("name", { ascending: true })

    if (error) {
      trackError("inventory", "listMaterialBundles", error.message, { table: "material_bundles" })
      return { error: error.message }
    }
    return { data: (data ?? []) as Bundle[] }
  }) as Promise<{ data?: Bundle[]; error?: string }>
}

export async function listBundleItems(
  bundleId: string
): Promise<{ data?: BundleItem[]; error?: string }> {
  return withAuth("lager", "read", async ({ profile, db }) => {
    // Verify bundle belongs to company
    const { data: bundle } = await db
      .from("material_bundles")
      .select("id")
      .eq("id", bundleId)
      .eq("company_id", profile.company_id)
      .single()

    if (!bundle) return { error: "Bündel nicht gefunden" }

    const { data, error } = await db
      .from("material_bundle_items")
      .select("*, materials(name, unit)")
      .eq("bundle_id", bundleId)
      .order("created_at", { ascending: true })

    if (error) {
      trackError("inventory", "listBundleItems", error.message, { table: "material_bundle_items" })
      return { error: error.message }
    }

    const items: BundleItem[] = (data ?? []).map((row) => {
      const typed = row as MaterialBundleItemRow & {
        materials: { name: string; unit: string } | null
      }
      const { materials, ...rest } = typed
      return {
        ...(rest as MaterialBundleItemRow),
        material_name: materials?.name ?? null,
        material_unit: materials?.unit ?? null,
      }
    })

    return { data: items }
  }) as Promise<{ data?: BundleItem[]; error?: string }>
}

export async function createMaterialBundle(
  formData: FormData
): Promise<{ success?: boolean; data?: Bundle; error?: string | Record<string, string[]> }> {
  return withAuth("lager", "write", async ({ user, profile, db }) => {
    const validated = bundleSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { data, error } = await db
      .from("material_bundles")
      .insert({
        company_id: profile.company_id,
        name: v.name,
        description: v.description,
      })
      .select("*")
      .single()

    if (error || !data) {
      trackError("inventory", "createMaterialBundle", error?.message ?? "insert failed", {
        table: "material_bundles",
      })
      return { error: "Bündel konnte nicht angelegt werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "material_bundle",
      entityId: data.id,
      title: `Bündel "${v.name}" angelegt`,
    })

    revalidatePath("/lager")
    return { success: true, data: data as Bundle }
  }) as Promise<{ success?: boolean; data?: Bundle; error?: string | Record<string, string[]> }>
}

export async function addBundleItem(
  bundleId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("lager", "write", async ({ profile, db }) => {
    const validated = bundleItemSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    // Verify bundle belongs to company
    const { data: bundle } = await db
      .from("material_bundles")
      .select("id")
      .eq("id", bundleId)
      .eq("company_id", profile.company_id)
      .single()

    if (!bundle) return { error: "Bündel nicht gefunden" }

    const v = validated.data
    const { error } = await db.from("material_bundle_items").insert({
      bundle_id: bundleId,
      material_id: v.material_id,
      quantity: v.quantity,
    })

    if (error) {
      trackError("inventory", "addBundleItem", error.message, { table: "material_bundle_items" })
      return { error: "Material konnte nicht hinzugefügt werden" }
    }

    revalidatePath("/lager")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function removeBundleItem(
  itemId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("lager", "write", async ({ profile, db }) => {
    // Defense in depth: verify the item's bundle belongs to company
    const { data: item } = await db
      .from("material_bundle_items")
      .select("bundle_id, material_bundles!inner(company_id)")
      .eq("id", itemId)
      .single()

    const itemBundle = item as {
      bundle_id: string
      material_bundles: { company_id: string } | null
    } | null
    if (!itemBundle || itemBundle.material_bundles?.company_id !== profile.company_id) {
      return { error: "Position nicht gefunden" }
    }

    const { error } = await db.from("material_bundle_items").delete().eq("id", itemId)

    if (error) {
      trackError("inventory", "removeBundleItem", error.message, { table: "material_bundle_items" })
      return { error: "Position konnte nicht entfernt werden" }
    }

    revalidatePath("/lager")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function deleteMaterialBundle(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("lager", "write", async ({ user, profile, db }) => {
    if (profile.role !== "owner") return { error: "Keine Berechtigung" }

    const { data: bundle } = await db
      .from("material_bundles")
      .select("name")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (!bundle) return { error: "Bündel nicht gefunden" }

    // Delete items first
    await db.from("material_bundle_items").delete().eq("bundle_id", id)

    const { error } = await db
      .from("material_bundles")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("inventory", "deleteMaterialBundle", error.message, { table: "material_bundles" })
      return { error: "Bündel konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "material_bundle",
      entityId: id,
      title: `Bündel "${bundle.name}" gelöscht`,
    })

    revalidatePath("/lager")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Stats ───────────────────────────────────────────────────

export async function getInventoryStats(): Promise<{ data?: InventoryStats; error?: string }> {
  return withAuth("lager", "read", async ({ profile, db }) => {
    const [materialsRes, ordersRes] = await Promise.all([
      db
        .from("materials")
        .select("current_stock, min_stock, price_per_unit")
        .eq("company_id", profile.company_id)
        .is("deleted_at", null),
      db
        .from("purchase_orders")
        .select("id")
        .eq("company_id", profile.company_id)
        .in("status", ["draft", "ordered", "partially_delivered"]),
    ])

    if (materialsRes.error) {
      trackError("inventory", "getInventoryStats", materialsRes.error.message, {
        table: "materials",
      })
      return { error: materialsRes.error.message }
    }

    const materials = materialsRes.data ?? []
    const totalMaterials = materials.length
    const belowMinStock = materials.filter(
      (m) => m.min_stock !== null && (m.current_stock ?? 0) < (m.min_stock ?? 0)
    ).length
    const showPrices = canSeePrices(profile)
    const stockValue = showPrices
      ? materials.reduce(
          (sum, m) => sum + (m.current_stock ?? 0) * (m.price_per_unit ?? 0),
          0
        )
      : 0
    const openOrders = ordersRes.data?.length ?? 0

    return { data: { totalMaterials, belowMinStock, openOrders, stockValue } }
  }) as Promise<{ data?: InventoryStats; error?: string }>
}
