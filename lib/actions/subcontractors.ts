"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { withAuth } from "@/lib/utils/auth-helper"
import { trackError } from "@/lib/utils/error-tracker"
import { logActivity } from "@/lib/utils/activity-logger"
import type { Database } from "@/lib/types/database"

// ─── DB Row Shortcuts (fully typed — no AnyRow) ───────────────
type SubcontractorRow = Database["public"]["Tables"]["subcontractors"]["Row"]
type AssignmentRow = Database["public"]["Tables"]["subcontractor_assignments"]["Row"]

// ─── Public Types ─────────────────────────────────────────────

export type Subcontractor = SubcontractorRow & {
  active_assignments?: number
}

export type SubcontractorAssignment = AssignmentRow & {
  order_title?: string | null
}

export type TaxExemptionStatus = "valid" | "expiring" | "expired" | "missing"

export type ExpiringExemption = {
  id: string
  name: string
  tax_exemption_valid_until: string | null
  days_until: number
  status: TaxExemptionStatus
}

// ─── Helpers ──────────────────────────────────────────────────

function classifyExemption(validUntil: string | null, horizonDays = 30): TaxExemptionStatus {
  if (!validUntil) return "missing"
  const today = new Date()
  const expiry = new Date(validUntil)
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return "expired"
  if (diffDays <= horizonDays) return "expiring"
  return "valid"
}

// ─── Zod Schemas ──────────────────────────────────────────────

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v : null))

const decimalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null))

const ratingString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? parseInt(v, 10) : null))

const subcontractorSchema = z.object({
  name: z.string().min(1, "Firmenname ist erforderlich"),
  trade: optionalString,
  contact_person: optionalString,
  email: z
    .string()
    .email("Ungültige E-Mail-Adresse")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  phone: optionalString,
  address: optionalString,
  tax_exemption_valid_until: optionalString,
  reverse_charge_13b: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "on"),
  reverse_charge_certificate_valid_until: optionalString,
  quality_rating: ratingString,
  reliability_rating: ratingString,
  price_rating: ratingString,
  notes: optionalString,
})

const assignmentSchema = z.object({
  order_id: z.string().uuid("Auftrag ist erforderlich"),
  description: z.string().min(1, "Beschreibung ist erforderlich"),
  agreed_amount: decimalString,
  invoiced_amount: decimalString,
  status: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : "active")),
})

const assignmentUpdateSchema = assignmentSchema.partial().extend({
  status: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : undefined)),
})

// ─── Subcontractors ───────────────────────────────────────────

export async function listSubcontractors(): Promise<{ data?: Subcontractor[]; error?: string }> {
  return withAuth("subunternehmer", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("subcontractors")
      .select("*")
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .order("name", { ascending: true })

    if (error) {
      trackError("subcontractors", "listSubcontractors", error.message, { table: "subcontractors" })
      return { error: "Subunternehmer konnten nicht geladen werden" }
    }

    // Aggregate active assignment counts (scoped by company_id — v1 bug fix)
    const { data: assignmentRows, error: aErr } = await db
      .from("subcontractor_assignments")
      .select("subcontractor_id")
      .eq("company_id", profile.company_id)
      .eq("status", "active")

    if (aErr) {
      trackError("subcontractors", "listSubcontractors.counts", aErr.message, {
        table: "subcontractor_assignments",
      })
    }

    const counts = new Map<string, number>()
    for (const row of assignmentRows ?? []) {
      counts.set(row.subcontractor_id, (counts.get(row.subcontractor_id) ?? 0) + 1)
    }

    const result: Subcontractor[] = (data ?? []).map((row) => ({
      ...(row as SubcontractorRow),
      active_assignments: counts.get(row.id) ?? 0,
    }))

    return { data: result }
  }) as Promise<{ data?: Subcontractor[]; error?: string }>
}

export async function getSubcontractor(
  id: string
): Promise<{ data?: Subcontractor; error?: string }> {
  return withAuth("subunternehmer", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("subcontractors")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .single()

    if (error || !data) {
      trackError("subcontractors", "getSubcontractor", error?.message ?? "not found", {
        table: "subcontractors",
        id,
      })
      return { error: "Subunternehmer nicht gefunden" }
    }
    return { data: data as Subcontractor }
  }) as Promise<{ data?: Subcontractor; error?: string }>
}

export async function createSubcontractor(
  formData: FormData
): Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }> {
  return withAuth("subunternehmer", "write", async ({ user, profile, db }) => {
    const validated = subcontractorSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { data, error } = await db
      .from("subcontractors")
      .insert({
        company_id: profile.company_id,
        name: v.name,
        trade: v.trade,
        contact_person: v.contact_person,
        email: v.email,
        phone: v.phone,
        address: v.address,
        tax_exemption_valid_until: v.tax_exemption_valid_until,
        reverse_charge_13b: v.reverse_charge_13b,
        reverse_charge_certificate_valid_until: v.reverse_charge_certificate_valid_until,
        quality_rating: v.quality_rating,
        reliability_rating: v.reliability_rating,
        price_rating: v.price_rating,
        notes: v.notes,
      })
      .select("id")
      .single()

    if (error || !data) {
      trackError(
        "subcontractors",
        "createSubcontractor",
        error?.message ?? "insert failed",
        { table: "subcontractors" }
      )
      return { error: "Subunternehmer konnte nicht angelegt werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "subcontractor",
      entityId: data.id,
      title: `Subunternehmer "${v.name}" angelegt`,
    })

    revalidatePath("/subunternehmer")
    return { success: true, id: data.id }
  }) as Promise<{
    success?: boolean
    id?: string
    error?: string | Record<string, string[]>
  }>
}

export async function updateSubcontractor(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("subunternehmer", "write", async ({ user, profile, db }) => {
    const validated = subcontractorSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { error } = await db
      .from("subcontractors")
      .update({
        name: v.name,
        trade: v.trade,
        contact_person: v.contact_person,
        email: v.email,
        phone: v.phone,
        address: v.address,
        tax_exemption_valid_until: v.tax_exemption_valid_until,
        reverse_charge_13b: v.reverse_charge_13b,
        reverse_charge_certificate_valid_until: v.reverse_charge_certificate_valid_until,
        quality_rating: v.quality_rating,
        reliability_rating: v.reliability_rating,
        price_rating: v.price_rating,
        notes: v.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("subcontractors", "updateSubcontractor", error.message, {
        table: "subcontractors",
      })
      return { error: "Änderungen konnten nicht gespeichert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "subcontractor",
      entityId: id,
      title: `Subunternehmer "${v.name}" aktualisiert`,
    })

    revalidatePath("/subunternehmer")
    revalidatePath(`/subunternehmer/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function deleteSubcontractor(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("subunternehmer", "write", async ({ user, profile, db }) => {
    // Delete nur für Owner (v1-Parität)
    if (profile.role !== "owner") return { error: "Keine Berechtigung" }

    const { data: existing } = await db
      .from("subcontractors")
      .select("name")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    // Soft delete — Assignments referenzieren Historie
    const { error } = await db
      .from("subcontractors")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("subcontractors", "deleteSubcontractor", error.message, {
        table: "subcontractors",
      })
      return { error: "Subunternehmer konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "subcontractor",
      entityId: id,
      title: existing
        ? `Subunternehmer "${existing.name}" gelöscht`
        : "Subunternehmer gelöscht",
    })

    revalidatePath("/subunternehmer")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Assignments ──────────────────────────────────────────────

export async function listAssignments(
  subcontractorId: string
): Promise<{ data?: SubcontractorAssignment[]; error?: string }> {
  return withAuth("subunternehmer", "read", async ({ profile, db }) => {
    // Ownership-Check: Subcontractor muss zur Company gehören
    const { data: owner } = await db
      .from("subcontractors")
      .select("id")
      .eq("id", subcontractorId)
      .eq("company_id", profile.company_id)
      .single()

    if (!owner) return { error: "Subunternehmer nicht gefunden" }

    const { data, error } = await db
      .from("subcontractor_assignments")
      .select(`*, orders (title)`)
      .eq("subcontractor_id", subcontractorId)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })

    if (error) {
      trackError("subcontractors", "listAssignments", error.message, {
        table: "subcontractor_assignments",
      })
      return { error: "Einsätze konnten nicht geladen werden" }
    }

    const rows: SubcontractorAssignment[] = (data ?? []).map((row) => {
      const typed = row as AssignmentRow & { orders: { title: string } | null }
      const { orders, ...rest } = typed
      return {
        ...(rest as AssignmentRow),
        order_title: orders?.title ?? null,
      }
    })

    return { data: rows }
  }) as Promise<{ data?: SubcontractorAssignment[]; error?: string }>
}

export async function getAssignment(
  id: string
): Promise<{ data?: SubcontractorAssignment; error?: string }> {
  return withAuth("subunternehmer", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("subcontractor_assignments")
      .select(`*, orders (title)`)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error || !data) {
      trackError("subcontractors", "getAssignment", error?.message ?? "not found", {
        table: "subcontractor_assignments",
        id,
      })
      return { error: "Einsatz nicht gefunden" }
    }

    const typed = data as AssignmentRow & { orders: { title: string } | null }
    const { orders, ...rest } = typed
    return {
      data: { ...(rest as AssignmentRow), order_title: orders?.title ?? null },
    }
  }) as Promise<{ data?: SubcontractorAssignment; error?: string }>
}

export async function createAssignment(
  subcontractorId: string,
  formData: FormData
): Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }> {
  return withAuth("subunternehmer", "write", async ({ user, profile, db }) => {
    const validated = assignmentSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data

    // Ownership-Check: Subcontractor gehört zur Company
    const { data: sub } = await db
      .from("subcontractors")
      .select("id, name")
      .eq("id", subcontractorId)
      .eq("company_id", profile.company_id)
      .single()
    if (!sub) return { error: "Subunternehmer nicht gefunden" }

    // Ownership-Check: Order gehört zur Company (v1-Bug: fehlte komplett)
    const { data: order } = await db
      .from("orders")
      .select("id, title")
      .eq("id", v.order_id)
      .eq("company_id", profile.company_id)
      .single()
    if (!order) return { error: "Auftrag nicht gefunden" }

    const { data, error } = await db
      .from("subcontractor_assignments")
      .insert({
        subcontractor_id: subcontractorId,
        company_id: profile.company_id,
        order_id: v.order_id,
        description: v.description,
        agreed_amount: v.agreed_amount,
        invoiced_amount: v.invoiced_amount,
        status: v.status ?? "active",
      })
      .select("id")
      .single()

    if (error || !data) {
      trackError("subcontractors", "createAssignment", error?.message ?? "insert failed", {
        table: "subcontractor_assignments",
      })
      return { error: "Einsatz konnte nicht angelegt werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "subcontractor_assignment",
      entityId: data.id,
      title: `Einsatz für "${sub.name}" am Auftrag "${order.title}" angelegt`,
    })

    revalidatePath(`/subunternehmer/${subcontractorId}`)
    return { success: true, id: data.id }
  }) as Promise<{
    success?: boolean
    id?: string
    error?: string | Record<string, string[]>
  }>
}

export async function updateAssignment(
  assignmentId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("subunternehmer", "write", async ({ user, profile, db }) => {
    const validated = assignmentUpdateSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data

    // CRITICAL v1-Fix: company_id Filter auf Assignment selbst
    const { data: existing } = await db
      .from("subcontractor_assignments")
      .select("id, subcontractor_id")
      .eq("id", assignmentId)
      .eq("company_id", profile.company_id)
      .single()

    if (!existing) return { error: "Einsatz nicht gefunden" }

    // Wenn neues order_id: Ownership prüfen
    if (v.order_id) {
      const { data: order } = await db
        .from("orders")
        .select("id")
        .eq("id", v.order_id)
        .eq("company_id", profile.company_id)
        .single()
      if (!order) return { error: "Auftrag nicht gefunden" }
    }

    const updatePayload: Database["public"]["Tables"]["subcontractor_assignments"]["Update"] = {
      updated_at: new Date().toISOString(),
    }
    if (v.order_id !== undefined) updatePayload.order_id = v.order_id
    if (v.description !== undefined) updatePayload.description = v.description
    if (v.agreed_amount !== undefined) updatePayload.agreed_amount = v.agreed_amount
    if (v.invoiced_amount !== undefined) updatePayload.invoiced_amount = v.invoiced_amount
    if (v.status !== undefined) updatePayload.status = v.status

    const { error } = await db
      .from("subcontractor_assignments")
      .update(updatePayload)
      .eq("id", assignmentId)
      .eq("company_id", profile.company_id) // CRITICAL v1-Fix

    if (error) {
      trackError("subcontractors", "updateAssignment", error.message, {
        table: "subcontractor_assignments",
      })
      return { error: "Einsatz konnte nicht aktualisiert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "subcontractor_assignment",
      entityId: assignmentId,
      title: "Einsatz aktualisiert",
    })

    revalidatePath(`/subunternehmer/${existing.subcontractor_id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function deleteAssignment(
  assignmentId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("subunternehmer", "write", async ({ user, profile, db }) => {
    // CRITICAL v1-Fix: company_id auf Assignment
    const { data: existing } = await db
      .from("subcontractor_assignments")
      .select("id, subcontractor_id")
      .eq("id", assignmentId)
      .eq("company_id", profile.company_id)
      .single()

    if (!existing) return { error: "Einsatz nicht gefunden" }

    const { error } = await db
      .from("subcontractor_assignments")
      .delete()
      .eq("id", assignmentId)
      .eq("company_id", profile.company_id) // CRITICAL v1-Fix

    if (error) {
      trackError("subcontractors", "deleteAssignment", error.message, {
        table: "subcontractor_assignments",
      })
      return { error: "Einsatz konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "subcontractor_assignment",
      entityId: assignmentId,
      title: "Einsatz gelöscht",
    })

    revalidatePath(`/subunternehmer/${existing.subcontractor_id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function markAssignmentCompleted(
  assignmentId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("subunternehmer", "write", async ({ user, profile, db }) => {
    const { data: existing } = await db
      .from("subcontractor_assignments")
      .select("id, subcontractor_id")
      .eq("id", assignmentId)
      .eq("company_id", profile.company_id)
      .single()

    if (!existing) return { error: "Einsatz nicht gefunden" }

    const { error } = await db
      .from("subcontractor_assignments")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", assignmentId)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("subcontractors", "markAssignmentCompleted", error.message, {
        table: "subcontractor_assignments",
      })
      return { error: "Einsatz konnte nicht abgeschlossen werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "subcontractor_assignment",
      entityId: assignmentId,
      title: "Einsatz als abgeschlossen markiert",
    })

    revalidatePath(`/subunternehmer/${existing.subcontractor_id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── §48b Tracking ────────────────────────────────────────────

export async function getSubcontractorsWithExpiringExemption(
  days: number = 30
): Promise<{ data?: ExpiringExemption[]; error?: string }> {
  return withAuth("subunternehmer", "read", async ({ profile, db }) => {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    const horizon = new Date(today.getTime() + days * 86400000)
      .toISOString()
      .split("T")[0]

    const { data, error } = await db
      .from("subcontractors")
      .select("id, name, tax_exemption_valid_until")
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .not("tax_exemption_valid_until", "is", null)
      .lte("tax_exemption_valid_until", horizon)
      .order("tax_exemption_valid_until", { ascending: true })

    if (error) {
      trackError(
        "subcontractors",
        "getSubcontractorsWithExpiringExemption",
        error.message,
        { table: "subcontractors" }
      )
      return { error: "§48b-Warnungen konnten nicht geladen werden" }
    }

    const warnings: ExpiringExemption[] = (data ?? []).map((row) => {
      const validUntil = row.tax_exemption_valid_until as string
      const diffDays = Math.floor(
        (new Date(validUntil).getTime() - new Date(todayStr).getTime()) / 86400000
      )
      return {
        id: row.id,
        name: row.name,
        tax_exemption_valid_until: validUntil,
        days_until: diffDays,
        status: classifyExemption(validUntil, days),
      }
    })

    return { data: warnings }
  }) as Promise<{ data?: ExpiringExemption[]; error?: string }>
}

// ─── Rating ───────────────────────────────────────────────────

const rateSchema = z.object({
  quality_rating: ratingString,
  reliability_rating: ratingString,
  price_rating: ratingString,
})

export async function rateSubcontractor(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("subunternehmer", "write", async ({ user, profile, db }) => {
    const validated = rateSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { error } = await db
      .from("subcontractors")
      .update({
        quality_rating: validated.data.quality_rating,
        reliability_rating: validated.data.reliability_rating,
        price_rating: validated.data.price_rating,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("subcontractors", "rateSubcontractor", error.message, {
        table: "subcontractors",
      })
      return { error: "Bewertung konnte nicht gespeichert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "subcontractor",
      entityId: id,
      title: "Subunternehmer neu bewertet",
    })

    revalidatePath(`/subunternehmer/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}
