"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"
import { logActivity } from "@/lib/utils/activity-logger"
import { withAuth } from "@/lib/utils/auth-helper"

// ─── Types ────────────────────────────────────────────────────

export type Customer = {
  id: string
  company_id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ─── Schemas ──────────────────────────────────────────────────

const customerSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  contact_person: z.string().optional(),
  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  street: z.string().optional(),
  zip: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
})

// ─── Queries ──────────────────────────────────────────────────

export async function getCustomers(): Promise<{ data?: Customer[]; error?: string }> {
  return withAuth("auftraege", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("customers")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("name", { ascending: true })

    if (error) {
      trackError("customers", "getCustomers", error.message, { table: "customers" })
      return { error: error.message }
    }
    return { data }
  }) as Promise<{ data?: Customer[]; error?: string }>
}

export async function getCustomer(id: string): Promise<{ data?: Customer; error?: string }> {
  return withAuth("auftraege", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error) {
      trackError("customers", "getCustomer", error.message, { table: "customers" })
      return { error: error.message }
    }
    return { data }
  }) as Promise<{ data?: Customer; error?: string }>
}

// ─── Mutations ────────────────────────────────────────────────

export async function createCustomer(
  formData: FormData
): Promise<{ success?: boolean; data?: Customer; error?: string | Record<string, string[]> }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    const validated = customerSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    // Build address from AddressFields if provided, fall back to address string
    const { street, zip, city } = validated.data
    const combinedAddress = [street, zip && city ? `${zip} ${city}` : zip || city]
      .filter(Boolean).join(", ") || validated.data.address || null

    const { data, error } = await db
      .from("customers")
      .insert({
        company_id: profile.company_id,
        name: validated.data.name,
        contact_person: validated.data.contact_person || null,
        email: validated.data.email || null,
        phone: validated.data.phone || null,
        address: combinedAddress,
        street: street || null,
        zip: zip || null,
        city: city || null,
        notes: validated.data.notes || null,
      } as never)
      .select()
      .single()

    if (error) {
      trackError("customers", "createCustomer", error.message, { table: "customers" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "customer",
      entityId: (data as { id: string }).id,
      title: `Kunde "${validated.data.name}" angelegt`,
    })

    revalidatePath("/auftraege/kunden")
    return { success: true, data: data as Customer }
  }) as Promise<{ success?: boolean; data?: Customer; error?: string | Record<string, string[]> }>
}

export async function updateCustomer(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    const validated = customerSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success)
      return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }

    // Build address from AddressFields if provided, fall back to address string
    const { street, zip, city } = validated.data
    const combinedAddress = [street, zip && city ? `${zip} ${city}` : zip || city]
      .filter(Boolean).join(", ") || validated.data.address || null

    const { error } = await db
      .from("customers")
      .update({
        name: validated.data.name,
        contact_person: validated.data.contact_person || null,
        email: validated.data.email || null,
        phone: validated.data.phone || null,
        address: combinedAddress,
        street: street || null,
        zip: zip || null,
        city: city || null,
        notes: validated.data.notes || null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("customers", "updateCustomer", error.message, { table: "customers" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "customer",
      entityId: id,
      title: `Kunde "${validated.data.name}" aktualisiert`,
    })

    revalidatePath("/auftraege/kunden")
    revalidatePath(`/auftraege/kunden/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function deleteCustomer(id: string): Promise<{ success?: boolean; error?: string }> {
  return withAuth("auftraege", "write", async ({ user, profile, db }) => {
    // Only owner can delete customers
    if (profile.role !== "owner") {
      return { error: "Keine Berechtigung" }
    }

    // Get name for activity log before deletion
    const { data: customer } = await db
      .from("customers")
      .select("name")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    const { error } = await db
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("customers", "deleteCustomer", error.message, { table: "customers" })
      return { error: error.message }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "customer",
      entityId: id,
      title: customer ? `Kunde "${customer.name}" gelöscht` : `Kunde gelöscht`,
    })

    revalidatePath("/auftraege/kunden")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}
