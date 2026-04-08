"use server"

import { z } from "zod"
import { logActivity } from "@/lib/utils/activity-logger"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"
import { withAuth } from "@/lib/utils/auth-helper"
import type { SupabaseClient } from "@supabase/supabase-js"

// ─── Types ────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue"

export type Invoice = {
  id: string
  company_id: string
  order_id: string | null
  customer_id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  status: InvoiceStatus
  subtotal: number
  tax_rate: number | null
  tax_amount: number | null
  total: number
  paid_amount: number | null
  paid_date: string | null
  payment_method: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  customer_name?: string | null
  order_title?: string | null
}

export type InvoiceItem = {
  id: string
  invoice_id: string
  position: number
  description: string
  unit: string
  quantity: number
  unit_price: number
  total: number
  created_at: string
}

export type InvoiceReminder = {
  id: string
  invoice_id: string
  company_id: string
  reminder_level: number
  sent_date: string
  due_amount: number
  fee: number | null
  notes: string | null
  created_at: string
}

export type InvoiceStats = {
  totalRevenue: number
  paidAmount: number
  openAmount: number
  overdueAmount: number
  invoiceCount: number
  paidCount: number
  openCount: number
  overdueCount: number
}

// ─── Schemas ──────────────────────────────────────────────────

const invoiceSchema = z.object({
  customer_id: z.string().uuid("Kunde ist erforderlich"),
  order_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  invoice_date: z.string().min(1, "Rechnungsdatum ist erforderlich"),
  due_date: z
    .string()
    .optional()
    .transform((v) => v || null),
  tax_rate: z
    .string()
    .optional()
    .transform((v) =>
      v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null
    ),
  notes: z
    .string()
    .optional()
    .transform((v) => v || null),
})

const invoiceItemSchema = z.object({
  position: z.string().transform((v) => parseInt(v, 10)),
  description: z.string().min(1, "Beschreibung ist erforderlich"),
  unit: z.string().optional().default(""),
  quantity: z.string().transform((v) => parseFloat(v.replace(",", "."))),
  unit_price: z.string().transform((v) => parseFloat(v.replace(",", "."))),
})

const invoiceStatusSchema = z.enum(["draft", "sent", "paid", "overdue"])

const reminderSchema = z.object({
  reminder_level: z.string().transform((v) => parseInt(v, 10)),
  sent_date: z.string().min(1, "Datum ist erforderlich"),
  due_amount: z
    .string()
    .transform((v) => parseFloat(v.replace(",", "."))),
  fee: z
    .string()
    .optional()
    .transform((v) =>
      v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null
    ),
  notes: z
    .string()
    .optional()
    .transform((v) => v || null),
})

const markAsPaidSchema = z.object({
  paid_date: z.string().min(1, "Zahlungsdatum ist erforderlich"),
  payment_method: z
    .string()
    .optional()
    .transform((v) => v || null),
})

const regieInvoiceSchema = z.object({
  order_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  site_id: z.string().uuid("Baustelle ist erforderlich"),
  date_from: z.string().min(1, "Von-Datum ist erforderlich"),
  date_to: z.string().min(1, "Bis-Datum ist erforderlich"),
  customer_id: z.string().uuid("Kunde ist erforderlich"),
  tax_rate: z
    .string()
    .optional()
    .transform((v) =>
      v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null
    ),
})

// ─── Helpers ──────────────────────────────────────────────────

type AnyRow = Record<string, unknown>

/** Verify that an invoice belongs to the given company before operating on sub-entities. */
async function verifyInvoiceOwnership(
  db: SupabaseClient,
  invoiceId: string,
  companyId: string
): Promise<boolean> {
  const { data } = await db
    .from("invoices")
    .select("id")
    .eq("id", invoiceId)
    .eq("company_id", companyId)
    .single()
  return !!data
}

/** Get next invoice number from company settings (prefix configurable). */
async function getNextInvoiceNumber(
  db: SupabaseClient,
  companyId: string
): Promise<string> {
  const { data: company } = await db
    .from("companies")
    .select("invoice_prefix, next_invoice_number")
    .eq("id", companyId)
    .single()

  const row = company as AnyRow | null
  const prefix = (row?.invoice_prefix as string | null) ?? "RE"
  const num = (row?.next_invoice_number as number | null) ?? 1
  return `${prefix}-${String(num).padStart(5, "0")}`
}

/** Increment invoice number counter in company settings. */
async function incrementInvoiceNumber(
  db: SupabaseClient,
  companyId: string
): Promise<void> {
  const { data: company } = await db
    .from("companies")
    .select("next_invoice_number")
    .eq("id", companyId)
    .single()

  const nextNum =
    ((company as AnyRow | null)?.next_invoice_number as number | null) ?? 1

  await db
    .from("companies")
    .update({ next_invoice_number: nextNum + 1 })
    .eq("id", companyId)
}

/** Recalculate invoice subtotal, tax, and total from items. */
async function recalculateInvoiceTotals(
  db: SupabaseClient,
  invoiceId: string,
  companyId: string
): Promise<void> {
  const { data: items } = await db
    .from("invoice_items")
    .select("total")
    .eq("invoice_id", invoiceId)

  const { data: invoice } = await db
    .from("invoices")
    .select("tax_rate")
    .eq("id", invoiceId)
    .single()

  const subtotal = ((items as AnyRow[]) || []).reduce(
    (sum, i) => sum + ((i.total as number) || 0),
    0
  )
  const taxRate = (invoice as AnyRow | null)?.tax_rate as number | null
  const taxAmount = taxRate ? (subtotal * taxRate) / 100 : 0
  const total = subtotal + taxAmount

  await db
    .from("invoices")
    .update({
      subtotal,
      tax_amount: taxAmount,
      total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .eq("company_id", companyId)
}

// ─── Queries ──────────────────────────────────────────────────

export async function getInvoices(): Promise<{
  data?: Invoice[]
  error?: string
}> {
  return withAuth("rechnungen", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("invoices")
      .select(`*, customers (name), orders (title)`)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })

    if (error) {
      trackError("invoices", "getInvoices", error.message, {
        table: "invoices",
      })
      return { error: error.message }
    }

    const invoices: Invoice[] = ((data as AnyRow[]) || []).map((row) => ({
      ...(row as unknown as Invoice),
      customer_name: (row.customers as AnyRow | null)?.name as string | null,
      order_title: (row.orders as AnyRow | null)?.title as string | null,
    }))

    return { data: invoices }
  }) as Promise<{ data?: Invoice[]; error?: string }>
}

export async function getInvoice(
  id: string
): Promise<{ data?: Invoice & { items: InvoiceItem[] }; error?: string }> {
  return withAuth("rechnungen", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("invoices")
      .select(`*, customers (name), orders (title)`)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error) {
      trackError("invoices", "getInvoice", error.message, {
        table: "invoices",
      })
      return { error: error.message }
    }

    // Fetch items inline so callers get everything in one call
    const { data: items, error: itemsError } = await db
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("position", { ascending: true })

    if (itemsError) {
      trackError("invoices", "getInvoice.items", itemsError.message, {
        table: "invoice_items",
      })
      return { error: itemsError.message }
    }

    const invoice = {
      ...(data as unknown as Invoice),
      customer_name: (data.customers as AnyRow | null)?.name as string | null,
      order_title: (data.orders as AnyRow | null)?.title as string | null,
      items: (items ?? []) as InvoiceItem[],
    }

    return { data: invoice }
  }) as Promise<{ data?: Invoice & { items: InvoiceItem[] }; error?: string }>
}

// ─── Mutations ────────────────────────────────────────────────

export async function createInvoice(
  formData: FormData
): Promise<{
  success?: boolean
  data?: Invoice
  error?: string | Record<string, string[]>
}> {
  return withAuth("rechnungen", "write", async ({ user, profile, db }) => {
    const validated = invoiceSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return {
        error: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }

    // Auto-number: prefix configurable via company settings
    const invoiceNumber = await getNextInvoiceNumber(db, profile.company_id)

    const insertData = {
      company_id: profile.company_id,
      customer_id: validated.data.customer_id,
      order_id: validated.data.order_id,
      invoice_number: invoiceNumber,
      invoice_date: validated.data.invoice_date,
      due_date: validated.data.due_date,
      status: "draft",
      subtotal: 0,
      tax_rate: validated.data.tax_rate,
      tax_amount: 0,
      total: 0,
      notes: validated.data.notes,
    }

    const { data, error } = await db
      .from("invoices")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      trackError("invoices", "createInvoice", error.message, {
        table: "invoices",
      })
      return { error: error.message }
    }

    await incrementInvoiceNumber(db, profile.company_id)

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "invoice",
      entityId: (data as AnyRow).id as string,
      title: `Rechnung ${invoiceNumber} erstellt`,
    })

    revalidatePath("/rechnungen")
    return { success: true, data: data as Invoice }
  }) as Promise<{
    success?: boolean
    data?: Invoice
    error?: string | Record<string, string[]>
  }>
}

export async function updateInvoice(
  id: string,
  formData: FormData
): Promise<{
  success?: boolean
  error?: string | Record<string, string[]>
}> {
  return withAuth("rechnungen", "write", async ({ user, profile, db }) => {
    const validated = invoiceSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return {
        error: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }

    // Only drafts can be edited
    const { data: existing } = await db
      .from("invoices")
      .select("status")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if ((existing as AnyRow | null)?.status !== "draft") {
      return { error: "Nur Entwürfe können bearbeitet werden" }
    }

    const updateData = {
      customer_id: validated.data.customer_id,
      order_id: validated.data.order_id,
      invoice_date: validated.data.invoice_date,
      due_date: validated.data.due_date,
      tax_rate: validated.data.tax_rate,
      notes: validated.data.notes,
      updated_at: new Date().toISOString(),
    }

    const { error } = await db
      .from("invoices")
      .update(updateData)
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("invoices", "updateInvoice", error.message, {
        table: "invoices",
      })
      return { error: error.message }
    }

    // Recalculate in case tax_rate changed
    await recalculateInvoiceTotals(db, id, profile.company_id)

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "invoice",
      entityId: id,
      title: `Rechnung bearbeitet`,
    })

    revalidatePath("/rechnungen")
    revalidatePath(`/rechnungen/${id}`)
    return { success: true }
  }) as Promise<{
    success?: boolean
    error?: string | Record<string, string[]>
  }>
}

export async function deleteInvoice(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("rechnungen", "write", async ({ user, profile, db }) => {
    // Only owner can delete
    if (profile.role !== "owner" && profile.role !== "super_admin") {
      return { error: "Keine Berechtigung" }
    }

    // Only drafts can be deleted
    const { data: invoice } = await db
      .from("invoices")
      .select("status, invoice_number")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if ((invoice as AnyRow | null)?.status !== "draft") {
      return { error: "Nur Entwürfe können gelöscht werden" }
    }

    // Delete sub-entities first
    await db.from("invoice_items").delete().eq("invoice_id", id)
    await db.from("payment_reminders").delete().eq("invoice_id", id)

    const { error } = await db
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("invoices", "deleteInvoice", error.message, {
        table: "invoices",
      })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "invoice",
      entityId: id,
      title: `Rechnung ${(invoice as AnyRow | null)?.invoice_number ?? ""} gelöscht`,
    })

    revalidatePath("/rechnungen")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("rechnungen", "write", async ({ user, profile, db }) => {
    // Zod validation for status
    const parsed = invoiceStatusSchema.safeParse(status)
    if (!parsed.success) {
      return { error: "Ungültiger Status" }
    }

    const { error } = await db
      .from("invoices")
      .update({ status: parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("invoices", "updateInvoiceStatus", error.message, {
        table: "invoices",
      })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "invoice",
      entityId: id,
      title: `Rechnungsstatus auf "${parsed.data}" geändert`,
    })

    revalidatePath("/rechnungen")
    revalidatePath(`/rechnungen/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Invoice Items ────────────────────────────────────────────

export async function addInvoiceItem(
  invoiceId: string,
  formData: FormData
): Promise<{
  success?: boolean
  data?: InvoiceItem
  error?: string | Record<string, string[]>
}> {
  return withAuth("rechnungen", "write", async ({ profile, db }) => {
    const validated = invoiceItemSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return {
        error: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }

    if (!(await verifyInvoiceOwnership(db, invoiceId, profile.company_id))) {
      return { error: "Rechnung nicht gefunden" }
    }

    const total = validated.data.quantity * validated.data.unit_price

    const insertData = {
      invoice_id: invoiceId,
      position: validated.data.position,
      description: validated.data.description,
      unit: validated.data.unit,
      quantity: validated.data.quantity,
      unit_price: validated.data.unit_price,
      total,
    }

    const { data, error } = await db
      .from("invoice_items")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      trackError("invoices", "addInvoiceItem", error.message, {
        table: "invoice_items",
      })
      return { error: error.message }
    }

    await recalculateInvoiceTotals(db, invoiceId, profile.company_id)

    revalidatePath(`/rechnungen/${invoiceId}`)
    return { success: true, data: data as InvoiceItem }
  }) as Promise<{
    success?: boolean
    data?: InvoiceItem
    error?: string | Record<string, string[]>
  }>
}

export async function updateInvoiceItem(
  itemId: string,
  formData: FormData
): Promise<{
  success?: boolean
  error?: string | Record<string, string[]>
}> {
  return withAuth("rechnungen", "write", async ({ profile, db }) => {
    const validated = invoiceItemSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return {
        error: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }

    // Look up invoice_id from the item to verify ownership
    const { data: item } = await db
      .from("invoice_items")
      .select("invoice_id")
      .eq("id", itemId)
      .single()

    if (!item) {
      return { error: "Position nicht gefunden" }
    }

    const invoiceId = (item as AnyRow).invoice_id as string
    if (!(await verifyInvoiceOwnership(db, invoiceId, profile.company_id))) {
      return { error: "Rechnung nicht gefunden" }
    }

    const total = validated.data.quantity * validated.data.unit_price

    const updateData = {
      position: validated.data.position,
      description: validated.data.description,
      unit: validated.data.unit,
      quantity: validated.data.quantity,
      unit_price: validated.data.unit_price,
      total,
    }

    const { error } = await db
      .from("invoice_items")
      .update(updateData)
      .eq("id", itemId)

    if (error) {
      trackError("invoices", "updateInvoiceItem", error.message, {
        table: "invoice_items",
      })
      return { error: error.message }
    }

    await recalculateInvoiceTotals(db, invoiceId, profile.company_id)

    revalidatePath(`/rechnungen/${invoiceId}`)
    return { success: true }
  }) as Promise<{
    success?: boolean
    error?: string | Record<string, string[]>
  }>
}

export async function deleteInvoiceItem(
  itemId: string,
  invoiceId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("rechnungen", "write", async ({ profile, db }) => {
    if (!(await verifyInvoiceOwnership(db, invoiceId, profile.company_id))) {
      return { error: "Rechnung nicht gefunden" }
    }

    const { error } = await db
      .from("invoice_items")
      .delete()
      .eq("id", itemId)
      .eq("invoice_id", invoiceId)

    if (error) {
      trackError("invoices", "deleteInvoiceItem", error.message, {
        table: "invoice_items",
      })
      return { error: error.message }
    }

    await recalculateInvoiceTotals(db, invoiceId, profile.company_id)

    revalidatePath(`/rechnungen/${invoiceId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Mark as Paid ─────────────────────────────────────────────

export async function markAsPaid(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("rechnungen", "write", async ({ user, profile, db }) => {
    const validated = markAsPaidSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return {
        error: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }

    // Get invoice total as paid_amount
    const { data: invoice } = await db
      .from("invoices")
      .select("total, invoice_number")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (!invoice) {
      return { error: "Rechnung nicht gefunden" }
    }

    const { error } = await db
      .from("invoices")
      .update({
        status: "paid" as const,
        paid_date: validated.data.paid_date,
        paid_amount: (invoice as AnyRow).total as number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("invoices", "markAsPaid", error.message, {
        table: "invoices",
      })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "invoice",
      entityId: id,
      title: `Rechnung ${(invoice as AnyRow).invoice_number ?? ""} als bezahlt markiert`,
    })

    revalidatePath("/rechnungen")
    revalidatePath(`/rechnungen/${id}`)
    return { success: true }
  }) as Promise<{
    success?: boolean
    error?: string | Record<string, string[]>
  }>
}

// ─── Reminders ────────────────────────────────────────────────

export async function addReminder(
  invoiceId: string,
  formData: FormData
): Promise<{
  success?: boolean
  data?: InvoiceReminder
  error?: string | Record<string, string[]>
}> {
  return withAuth("rechnungen", "write", async ({ user, profile, db }) => {
    const validated = reminderSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return {
        error: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }

    if (!(await verifyInvoiceOwnership(db, invoiceId, profile.company_id))) {
      return { error: "Rechnung nicht gefunden" }
    }

    // Validate reminder level (1, 2, or 3)
    if (
      validated.data.reminder_level < 1 ||
      validated.data.reminder_level > 3
    ) {
      return { error: "Mahnstufe muss zwischen 1 und 3 liegen" }
    }

    const insertData = {
      invoice_id: invoiceId,
      company_id: profile.company_id,
      reminder_level: validated.data.reminder_level,
      sent_date: validated.data.sent_date,
      due_amount: validated.data.due_amount,
      fee: validated.data.fee,
      notes: validated.data.notes,
    }

    const { data, error } = await db
      .from("payment_reminders")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      trackError("invoices", "addReminder", error.message, {
        table: "payment_reminders",
      })
      return { error: error.message }
    }

    // Mark invoice as overdue if it was draft or sent
    await db
      .from("invoices")
      .update({ status: "overdue", updated_at: new Date().toISOString() })
      .eq("id", invoiceId)
      .eq("company_id", profile.company_id)
      .in("status", ["sent", "draft"])

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "invoice_reminder",
      entityId: (data as AnyRow).id as string,
      title: `Mahnung Stufe ${validated.data.reminder_level} erstellt`,
    })

    revalidatePath(`/rechnungen/${invoiceId}`)
    revalidatePath("/rechnungen")
    return { success: true, data: data as InvoiceReminder }
  }) as Promise<{
    success?: boolean
    data?: InvoiceReminder
    error?: string | Record<string, string[]>
  }>
}

// ─── Create from Order ───────────────────────────────────────

export async function createInvoiceFromOrder(
  orderId: string,
  customerId: string,
  taxRate: number | null
): Promise<{ success?: boolean; data?: Invoice; error?: string }> {
  return withAuth("rechnungen", "write", async ({ user, profile, db }) => {
    const invoiceNumber = await getNextInvoiceNumber(db, profile.company_id)

    const { data: orderItems, error: itemsError } = await db
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("position", { ascending: true })

    if (itemsError) {
      trackError("invoices", "createInvoiceFromOrder", itemsError.message, {
        table: "order_items",
      })
      return { error: itemsError.message }
    }

    const { data: company } = await db
      .from("companies")
      .select("payment_terms_days, default_tax_rate")
      .eq("id", profile.company_id)
      .single()

    const paymentTermsDays = company?.payment_terms_days ?? 14
    const defaultTaxRate = taxRate ?? company?.default_tax_rate ?? 19

    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + paymentTermsDays)

    const items = orderItems ?? []
    const subtotal = items.reduce(
      (sum, i) => sum + i.quantity * i.unit_price,
      0
    )
    const taxAmount = (subtotal * defaultTaxRate) / 100
    const total = subtotal + taxAmount

    const { data: invoice, error: invoiceError } = await db
      .from("invoices")
      .insert({
        company_id: profile.company_id,
        customer_id: customerId,
        order_id: orderId,
        invoice_number: invoiceNumber,
        invoice_date: today.toISOString().split("T")[0],
        due_date: dueDate.toISOString().split("T")[0],
        status: "draft",
        subtotal,
        tax_rate: defaultTaxRate,
        tax_amount: taxAmount,
        total,
      })
      .select()
      .single()

    if (invoiceError) {
      trackError("invoices", "createInvoiceFromOrder", invoiceError.message, {
        table: "invoices",
      })
      return { error: invoiceError.message }
    }

    if (items.length > 0) {
      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        position: item.position,
        description: item.description,
        unit: item.unit ?? "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }))
      await db.from("invoice_items").insert(invoiceItems)
    }

    await incrementInvoiceNumber(db, profile.company_id)

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "invoice",
      entityId: invoice.id as string,
      title: `Rechnung ${invoiceNumber} aus Auftrag erstellt`,
    })

    revalidatePath("/rechnungen")
    return { success: true, data: invoice as Invoice }
  }) as Promise<{ success?: boolean; data?: Invoice; error?: string }>
}

// ─── Sub-entity queries ─────────────────────────────────────

export async function getInvoiceItems(
  invoiceId: string
): Promise<{ data?: InvoiceItem[]; error?: string }> {
  return withAuth("rechnungen", "read", async ({ profile, db }) => {
    if (!(await verifyInvoiceOwnership(db, invoiceId, profile.company_id))) {
      return { error: "Rechnung nicht gefunden" }
    }

    const { data, error } = await db
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("position", { ascending: true })

    if (error) {
      trackError("invoices", "getInvoiceItems", error.message, {
        table: "invoice_items",
      })
      return { error: error.message }
    }
    return { data: data as InvoiceItem[] }
  }) as Promise<{ data?: InvoiceItem[]; error?: string }>
}

export async function getInvoiceReminders(
  invoiceId: string
): Promise<{ data?: InvoiceReminder[]; error?: string }> {
  return withAuth("rechnungen", "read", async ({ profile, db }) => {
    if (!(await verifyInvoiceOwnership(db, invoiceId, profile.company_id))) {
      return { error: "Rechnung nicht gefunden" }
    }

    const { data, error } = await db
      .from("payment_reminders")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("reminder_level", { ascending: true })

    if (error) {
      trackError("invoices", "getInvoiceReminders", error.message, {
        table: "payment_reminders",
      })
      return { error: error.message }
    }
    return { data: data as InvoiceReminder[] }
  }) as Promise<{ data?: InvoiceReminder[]; error?: string }>
}

// ─── Statistics ───────────────────────────────────────────────

export async function getInvoiceStats(): Promise<{
  data?: InvoiceStats
  error?: string
}> {
  return withAuth("rechnungen", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("invoices")
      .select("status, total, paid_amount")
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("invoices", "getInvoiceStats", error.message, {
        table: "invoices",
      })
      return { error: error.message }
    }

    const rows = (data as AnyRow[]) || []
    const stats: InvoiceStats = {
      totalRevenue: 0,
      paidAmount: 0,
      openAmount: 0,
      overdueAmount: 0,
      invoiceCount: rows.length,
      paidCount: 0,
      openCount: 0,
      overdueCount: 0,
    }

    for (const row of rows) {
      const total = (row.total as number) || 0
      stats.totalRevenue += total

      switch (row.status as InvoiceStatus) {
        case "paid":
          stats.paidAmount += (row.paid_amount as number) || total
          stats.paidCount++
          break
        case "overdue":
          stats.overdueAmount += total
          stats.overdueCount++
          break
        case "sent":
        case "draft":
          stats.openAmount += total
          stats.openCount++
          break
      }
    }

    return { data: stats }
  }) as Promise<{ data?: InvoiceStats; error?: string }>
}

// ─── Regierechnung (aus Zeiterfassung) ────────────────────────

export async function createRegieInvoice(
  formData: FormData
): Promise<{
  success?: boolean
  data?: Invoice
  error?: string | Record<string, string[]>
}> {
  return withAuth("rechnungen", "write", async ({ user, profile, db }) => {
    const validated = regieInvoiceSchema.safeParse(
      Object.fromEntries(formData)
    )
    if (!validated.success)
      return {
        error: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }

    const { site_id, date_from, date_to, customer_id, order_id, tax_rate } =
      validated.data

    // 1. Load time entries for site + date range
    const { data: entries, error: entriesError } = await db
      .from("time_entries")
      .select("user_id, clock_in, clock_out, break_minutes")
      .eq("site_id", site_id)
      .eq("company_id", profile.company_id)
      .gte("clock_in", `${date_from}T00:00:00`)
      .lte("clock_in", `${date_to}T23:59:59`)
      .not("clock_out", "is", null)

    if (entriesError) {
      trackError("invoices", "createRegieInvoice", entriesError.message, {
        table: "time_entries",
      })
      return { error: entriesError.message }
    }

    const entryRows = (entries as AnyRow[]) || []
    const userIds = [
      ...new Set(entryRows.map((e) => e.user_id as string)),
    ]

    if (userIds.length === 0) {
      return { error: "Keine Zeiteinträge im gewählten Zeitraum" }
    }

    // 2. Load profiles for job_title + hourly_rate
    const { data: profilesData } = await db
      .from("profiles")
      .select("id, job_title, hourly_rate")
      .in("id", userIds)

    const profileMap = new Map<
      string,
      { jobTitle: string; rate: number }
    >()
    for (const p of (profilesData as AnyRow[]) || []) {
      profileMap.set(p.id as string, {
        jobTitle: (p.job_title as string) || "Mitarbeiter",
        rate: (p.hourly_rate as number) || 0,
      })
    }

    // 3. Group by job title: MA x Stunden x Stundensatz = Positionen
    const byTitle = new Map<string, { hours: number; rate: number }>()
    for (const e of entryRows) {
      const p = profileMap.get(e.user_id as string)
      if (!p || !p.rate) continue
      const hours = Math.max(
        0,
        (new Date(e.clock_out as string).getTime() -
          new Date(e.clock_in as string).getTime()) /
          3600000 -
          ((e.break_minutes as number) || 0) / 60
      )
      const existing = byTitle.get(p.jobTitle) || { hours: 0, rate: p.rate }
      existing.hours += hours
      byTitle.set(p.jobTitle, existing)
    }

    if (byTitle.size === 0) {
      return { error: "Keine abrechenbaren Stunden gefunden" }
    }

    // 4. Build invoice items
    const invoiceNumber = await getNextInvoiceNumber(db, profile.company_id)
    let subtotal = 0
    const items: {
      position: number
      description: string
      unit: string
      quantity: number
      unit_price: number
      total: number
    }[] = []
    let pos = 1

    for (const [title, { hours, rate }] of byTitle) {
      const roundedHours = Math.round(hours * 10) / 10
      const lineTotal = Math.round(roundedHours * rate * 100) / 100
      items.push({
        position: pos++,
        description: `${title}: ${roundedHours} Std.`,
        unit: "Std.",
        quantity: roundedHours,
        unit_price: rate,
        total: lineTotal,
      })
      subtotal += lineTotal
    }

    // 5. Get company defaults for tax + payment terms
    const { data: company } = await db
      .from("companies")
      .select("default_tax_rate, payment_terms_days")
      .eq("id", profile.company_id)
      .single()

    const companyRow = company as AnyRow | null
    const effTaxRate =
      tax_rate ?? (companyRow?.default_tax_rate as number | null) ?? 19
    const paymentTermsDays =
      (companyRow?.payment_terms_days as number | null) ?? 14

    const taxAmount = Math.round(subtotal * effTaxRate) / 100
    const total = subtotal + taxAmount

    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + paymentTermsDays)

    // 6. Create invoice
    const { data: invoice, error: invoiceError } = await db
      .from("invoices")
      .insert({
        company_id: profile.company_id,
        customer_id: customer_id,
        order_id: order_id,
        invoice_number: invoiceNumber,
        invoice_date: today.toISOString().split("T")[0],
        due_date: dueDate.toISOString().split("T")[0],
        status: "draft",
        subtotal,
        tax_rate: effTaxRate,
        tax_amount: taxAmount,
        total,
      })
      .select()
      .single()

    if (invoiceError) {
      trackError("invoices", "createRegieInvoice", invoiceError.message, {
        table: "invoices",
      })
      return { error: invoiceError.message }
    }

    // 7. Insert invoice items
    if (items.length > 0) {
      await db.from("invoice_items").insert(
        items.map((i) => ({
          invoice_id: (invoice as AnyRow).id as string,
          ...i,
        }))
      )
    }

    await incrementInvoiceNumber(db, profile.company_id)

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "invoice",
      entityId: (invoice as AnyRow).id as string,
      title: `Regierechnung ${invoiceNumber} erstellt`,
    })

    revalidatePath("/rechnungen")
    return { success: true, data: invoice as Invoice }
  }) as Promise<{
    success?: boolean
    data?: Invoice
    error?: string | Record<string, string[]>
  }>
}
