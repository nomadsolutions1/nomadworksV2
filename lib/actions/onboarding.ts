"use server"

import { z } from "zod"
import { requireCompanyAuth } from "@/lib/utils/auth-helper"
import { revalidatePath } from "next/cache"

type AnyRow = Record<string, unknown>

// ─── updateOnboardingStep ────────────────────────────────────

export async function updateOnboardingStep(step: number) {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { error: "Nicht authentifiziert" }
  if (profile.role !== "owner") return { error: "Keine Berechtigung" }

  await db
    .from("companies")
    .update({ onboarding_step: step })
    .eq("id", profile.company_id)

  return { success: true }
}

// ─── updateOnboardingCompanyData ─────────────────────────────

const companyDataSchema = z.object({
  name: z.string().min(1, "Firmenname ist erforderlich"),
  address: z.string().optional().transform((v) => v || null),
  tax_id: z.string().optional().transform((v) => v || null),
  trade_license: z.string().optional().transform((v) => v || null),
  employee_count_range: z.string().optional().transform((v) => v || null),
  revenue_range: z.string().optional().transform((v) => v || null),
  trades: z.string().optional().transform((v) => v || null),
})

export async function updateOnboardingCompanyData(formData: FormData) {
  const validated = companyDataSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten().fieldErrors }

  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { error: "Nicht authentifiziert" }
  if (profile.role !== "owner") return { error: "Keine Berechtigung" }

  const { employee_count_range, revenue_range, trades, ...companyFields } = validated.data

  const onboardingData = {
    employee_count_range,
    revenue_range,
    trades: trades ? trades.split(",").map((t) => t.trim()) : [],
  }

  await db
    .from("companies")
    .update({
      ...companyFields,
      onboarding_data: onboardingData,
      onboarding_step: 2,
    })
    .eq("id", profile.company_id)

  revalidatePath("/onboarding")
  return { success: true }
}

// ─── updateOnboardingInvoiceSettings ─────────────────────────

const invoiceSchema = z.object({
  bank_name: z.string().optional().transform((v) => v || null),
  bank_iban: z.string().optional().transform((v) => v || null),
  bank_bic: z.string().optional().transform((v) => v || null),
  invoice_prefix: z.string().min(1, "Rechnungspräfix ist erforderlich"),
  default_tax_rate: z.string().transform((v) => parseFloat(v) || 19),
  payment_terms_days: z.string().transform((v) => parseInt(v) || 14),
})

export async function updateOnboardingInvoiceSettings(formData: FormData) {
  const validated = invoiceSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten().fieldErrors }

  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { error: "Nicht authentifiziert" }
  if (profile.role !== "owner") return { error: "Keine Berechtigung" }

  await db
    .from("companies")
    .update({
      ...validated.data,
      onboarding_step: 3,
    })
    .eq("id", profile.company_id)

  revalidatePath("/onboarding")
  return { success: true }
}

// ─── completeOnboarding ──────────────────────────────────────

export async function completeOnboarding() {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { error: "Nicht authentifiziert" }
  if (profile.role !== "owner") return { error: "Keine Berechtigung" }

  await db
    .from("companies")
    .update({ onboarding_completed: true, onboarding_step: 6 })
    .eq("id", profile.company_id)

  revalidatePath("/", "layout")
  return { success: true }
}

// ─── getOnboardingData ───────────────────────────────────────

export async function getOnboardingData() {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { error: "Nicht authentifiziert" }

  const [{ data: company }, { data: profileData }] = await Promise.all([
    db.from("companies")
      .select("name, address, tax_id, trade_license, onboarding_step, bank_name, bank_iban, bank_bic, invoice_prefix, default_tax_rate, payment_terms_days")
      .eq("id", profile.company_id)
      .single(),
    db.from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single(),
  ])

  return {
    data: {
      company: company as AnyRow | null,
      firstName: ((profileData as AnyRow | null)?.first_name as string) || "",
    },
  }
}
