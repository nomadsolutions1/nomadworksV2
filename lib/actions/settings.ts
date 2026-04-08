"use server"

import { z } from "zod"
import { requireCompanyAuth } from "@/lib/utils/auth-helper"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"

type AnyRow = Record<string, unknown>

// ─── Types ────────────────────────────────────────────────────

export type CompanySettings = {
  id: string
  name: string
  address: string | null
  tax_id: string | null
  trade_license: string | null
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  invoice_prefix: string | null
  next_invoice_number: number | null
  default_tax_rate: number | null
  payment_terms_days: number | null
  bank_name: string | null
  bank_iban: string | null
  bank_bic: string | null
  soka_betriebskonto_nr: string | null
  soka_branchenkennziffer: string | null
  soka_umlagesatz_urlaub: number | null
  soka_umlagesatz_berufsbildung: number | null
  soka_umlagesatz_rente: number | null
  tax_advisor_name: string | null
  tax_advisor_email: string | null
  tax_advisor_phone: string | null
  tax_advisor_firm: string | null
  plan: string
  max_employees: number
  monthly_price: number
  is_active: boolean
  trial_ends_at: string | null
}

// ─── Schemas ──────────────────────────────────────────────────

const companyDataSchema = z.object({
  name: z.string().min(1, "Firmenname ist erforderlich"),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  trade_license: z.string().optional(),
})

const brandingSchema = z.object({
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
})

const invoiceSettingsSchema = z.object({
  invoice_prefix: z.string().min(1, "Präfix ist erforderlich"),
  default_tax_rate: z.string(),
  payment_terms_days: z.string(),
  bank_name: z.string().optional(),
  bank_iban: z.string().optional(),
  bank_bic: z.string().optional(),
})

const sokaSchema = z.object({
  soka_betriebskonto_nr: z.string().optional(),
  soka_branchenkennziffer: z.string().optional(),
  soka_umlagesatz_urlaub: z.string().optional(),
  soka_umlagesatz_berufsbildung: z.string().optional(),
  soka_umlagesatz_rente: z.string().optional(),
})

const taxAdvisorSchema = z.object({
  tax_advisor_name: z.string().optional(),
  tax_advisor_firm: z.string().optional(),
  tax_advisor_email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  tax_advisor_phone: z.string().optional(),
})

// ─── Helper ───────────────────────────────────────────────────

async function getCompanyIdAndRole() {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { companyId: null, role: null, db: null as never }

  return {
    companyId: profile.company_id as string | null,
    role: profile.role as string | null,
    db,
  }
}

// ─── Actions ──────────────────────────────────────────────────

export async function getCompanySettings(): Promise<{ data: CompanySettings | null; error: string | null }> {
  const { companyId, role, db } = await getCompanyIdAndRole()
  if (!companyId) return { data: null, error: "Nicht authentifiziert" }
  if (!["super_admin", "owner"].includes(role ?? "")) return { data: null, error: "Keine Berechtigung" }

  const { data, error } = await db
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single()

  if (error) {
    trackError("settings", "getCompanySettings", error.message, { table: "companies" })
    return { data: null, error: error.message }
  }
  return { data: data as CompanySettings, error: null }
}

export async function updateCompanySettings(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { companyId, role, db } = await getCompanyIdAndRole()
  if (!companyId) return { error: "Nicht authentifiziert" }
  if (!["super_admin", "owner"].includes(role ?? "")) return { error: "Keine Berechtigung" }

  const validated = companyDataSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const v = validated.data
  const { error } = await db
    .from("companies")
    .update({
      name: v.name,
      address: v.address || null,
      tax_id: v.tax_id || null,
      trade_license: v.trade_license || null,
    })
    .eq("id", companyId)

  if (error) {
    trackError("settings", "updateCompanySettings", error.message, { table: "companies" })
    return { error: error.message }
  }

  revalidatePath("/firma")
  return { success: true }
}

export async function updateBranding(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { companyId, role, db } = await getCompanyIdAndRole()
  if (!companyId) return { error: "Nicht authentifiziert" }
  if (!["super_admin", "owner"].includes(role ?? "")) return { error: "Keine Berechtigung" }

  const validated = brandingSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const { error } = await db
    .from("companies")
    .update({
      primary_color: validated.data.primary_color || null,
      secondary_color: validated.data.secondary_color || null,
    })
    .eq("id", companyId)

  if (error) {
    trackError("settings", "updateBranding", error.message, { table: "companies" })
    return { error: error.message }
  }

  revalidatePath("/firma")
  return { success: true }
}

export async function updateInvoiceSettings(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { companyId, role, db } = await getCompanyIdAndRole()
  if (!companyId) return { error: "Nicht authentifiziert" }
  if (!["super_admin", "owner"].includes(role ?? "")) return { error: "Keine Berechtigung" }

  const validated = invoiceSettingsSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const v = validated.data
  const { error } = await db
    .from("companies")
    .update({
      invoice_prefix: v.invoice_prefix,
      default_tax_rate: parseFloat(v.default_tax_rate),
      payment_terms_days: parseInt(v.payment_terms_days),
      bank_name: v.bank_name || null,
      bank_iban: v.bank_iban || null,
      bank_bic: v.bank_bic || null,
    })
    .eq("id", companyId)

  if (error) {
    trackError("settings", "updateInvoiceSettings", error.message, { table: "companies" })
    return { error: error.message }
  }

  revalidatePath("/firma")
  return { success: true }
}

export async function getSOKASettings(): Promise<{ data: AnyRow | null; error: string | null }> {
  const { companyId, role, db } = await getCompanyIdAndRole()
  if (!companyId) return { data: null, error: "Nicht authentifiziert" }
  if (!["super_admin", "owner"].includes(role ?? "")) return { data: null, error: "Keine Berechtigung" }

  const { data, error } = await db
    .from("companies")
    .select("soka_betriebskonto_nr, soka_branchenkennziffer, soka_umlagesatz_urlaub, soka_umlagesatz_berufsbildung, soka_umlagesatz_rente")
    .eq("id", companyId)
    .single()

  if (error) {
    trackError("settings", "getSOKASettings", error.message, { table: "companies" })
    return { data: null, error: error.message }
  }
  return { data, error: null }
}

export async function updateSOKASettings(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { companyId, role, db } = await getCompanyIdAndRole()
  if (!companyId) return { error: "Nicht authentifiziert" }
  if (!["super_admin", "owner"].includes(role ?? "")) return { error: "Keine Berechtigung" }

  const validated = sokaSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const v = validated.data
  const { error } = await db
    .from("companies")
    .update({
      soka_betriebskonto_nr: v.soka_betriebskonto_nr || null,
      soka_branchenkennziffer: v.soka_branchenkennziffer || null,
      soka_umlagesatz_urlaub: v.soka_umlagesatz_urlaub ? parseFloat(v.soka_umlagesatz_urlaub) : null,
      soka_umlagesatz_berufsbildung: v.soka_umlagesatz_berufsbildung ? parseFloat(v.soka_umlagesatz_berufsbildung) : null,
      soka_umlagesatz_rente: v.soka_umlagesatz_rente ? parseFloat(v.soka_umlagesatz_rente) : null,
    })
    .eq("id", companyId)

  if (error) {
    trackError("settings", "updateSOKASettings", error.message, { table: "companies" })
    return { error: error.message }
  }

  revalidatePath("/firma")
  return { success: true }
}

export async function getTaxAdvisorSettings(): Promise<{ data: AnyRow | null; error: string | null }> {
  const { companyId, role, db } = await getCompanyIdAndRole()
  if (!companyId) return { data: null, error: "Nicht authentifiziert" }
  if (!["super_admin", "owner"].includes(role ?? "")) return { data: null, error: "Keine Berechtigung" }

  const { data, error } = await db
    .from("companies")
    .select("tax_advisor_name, tax_advisor_firm, tax_advisor_email, tax_advisor_phone")
    .eq("id", companyId)
    .single()

  if (error) {
    trackError("settings", "getTaxAdvisorSettings", error.message, { table: "companies" })
    return { data: null, error: error.message }
  }
  return { data, error: null }
}

export async function updateTaxAdvisorSettings(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { companyId, role, db } = await getCompanyIdAndRole()
  if (!companyId) return { error: "Nicht authentifiziert" }
  if (!["super_admin", "owner"].includes(role ?? "")) return { error: "Keine Berechtigung" }

  const validated = taxAdvisorSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const v = validated.data
  const { error } = await db
    .from("companies")
    .update({
      tax_advisor_name: v.tax_advisor_name || null,
      tax_advisor_firm: v.tax_advisor_firm || null,
      tax_advisor_email: v.tax_advisor_email || null,
      tax_advisor_phone: v.tax_advisor_phone || null,
    })
    .eq("id", companyId)

  if (error) {
    trackError("settings", "updateTaxAdvisorSettings", error.message, { table: "companies" })
    return { error: error.message }
  }

  revalidatePath("/firma")
  return { success: true }
}

// ─── Steuerberater-Zugang ────────────────────────────────────

export async function updateAccountantPermissions(
  accountantIdOrEmpty: string,
  mode: "accounting" | "full"
): Promise<{ success?: boolean; error?: string }> {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { error: "Nicht authentifiziert" }
  if (profile.role !== "owner") return { error: "Nur der Geschäftsführer kann dies ändern" }

  // Find accountant if no ID provided
  let accountantId = accountantIdOrEmpty
  if (!accountantId) {
    const { data: accountant } = await db
      .from("profiles")
      .select("id")
      .eq("company_id", profile.company_id)
      .eq("role", "accountant")
      .limit(1)
      .maybeSingle()

    if (!accountant) return { error: "Kein Steuerberater-Account gefunden. Legen Sie zuerst einen Steuerberater unter Mitarbeiter an." }
    accountantId = (accountant as Record<string, unknown>).id as string
  }

  // Delete existing permissions
  await db.from("foreman_permissions")
    .delete()
    .eq("foreman_id", accountantId)
    .eq("company_id", profile.company_id)

  // Set new permissions
  const modules = mode === "accounting"
    ? ["rechnungen", "bautagesbericht", "mitarbeiter"]
    : ["mitarbeiter", "baustellen", "zeiterfassung", "disposition", "auftraege", "fuhrpark", "lager", "rechnungen", "subunternehmer", "bautagesbericht"]

  const entries = modules.map((mod) => ({
    foreman_id: accountantId,
    company_id: profile.company_id,
    module_name: mod,
    can_view: true,
    can_edit: false,
    granted_by: user.id,
  }))

  await db.from("foreman_permissions").insert(entries)

  revalidatePath("/firma")
  return { success: true }
}
