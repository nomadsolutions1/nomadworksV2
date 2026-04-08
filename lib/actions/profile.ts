"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { requireCompanyAuth } from "@/lib/utils/auth-helper"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"

type AnyRow = Record<string, unknown>

// ─── Types ────────────────────────────────────────────────────

export type UserProfile = {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  role: string
  language: string | null
  annual_leave_days: number | null
  company_id: string | null
  company_name?: string | null
}

// ─── Schemas ──────────────────────────────────────────────────

const updateProfileSchema = z.object({
  first_name: z.string().min(1, "Vorname ist erforderlich"),
  last_name: z.string().min(1, "Nachname ist erforderlich"),
  phone: z.string().optional(),
})

const updateLanguageSchema = z.object({
  language: z.enum(["de", "en", "pl", "ro", "tr"] as const),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich"),
  newPassword: z.string().min(8, "Mindestens 8 Zeichen"),
  confirmPassword: z.string().min(1, "Bitte Passwort bestätigen"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
})

// ─── Actions ──────────────────────────────────────────────────

export async function getProfile(): Promise<{ data: UserProfile | null; error: string | null }> {
  const { user, db } = await requireCompanyAuth()
  if (!user) return { data: null, error: "Nicht authentifiziert" }

  const { data, error } = await db
    .from("profiles")
    .select("id, first_name, last_name, phone, role, language, annual_leave_days, company_id, companies(name)")
    .eq("id", user.id)
    .single()

  if (error) {
    trackError("profile", "getProfile", error.message, { table: "profiles" })
    return { data: null, error: error.message }
  }

  return {
    data: {
      ...data,
      company_name: data.companies?.name ?? null,
    },
    error: null,
  }
}

export async function updateProfile(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { user, db } = await requireCompanyAuth()
  if (!user) return { error: "Nicht authentifiziert" }

  const validated = updateProfileSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const v = validated.data
  const { error } = await db
    .from("profiles")
    .update({
      first_name: v.first_name,
      last_name: v.last_name,
      phone: v.phone || null,
    })
    .eq("id", user.id)

  if (error) {
    trackError("profile", "updateProfile", error.message, { table: "profiles" })
    return { error: error.message }
  }

  revalidatePath("/profil")
  return { success: true }
}

export async function updateLanguage(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { user, db } = await requireCompanyAuth()
  if (!user) return { error: "Nicht authentifiziert" }

  const validated = updateLanguageSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const { error } = await db
    .from("profiles")
    .update({ language: validated.data.language })
    .eq("id", user.id)

  if (error) {
    trackError("profile", "updateLanguage", error.message, { table: "profiles" })
    return { error: error.message }
  }

  revalidatePath("/profil")
  return { success: true }
}

export async function changePassword(formData: FormData): Promise<{ success?: boolean; error?: string | object }> {
  const { user } = await requireCompanyAuth()
  if (!user) return { error: "Nicht authentifiziert" }

  const validated = changePasswordSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  const v = validated.data

  // User-scoped client needed for auth operations
  const supabase = await createClient()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: v.currentPassword,
  })

  if (signInError) return { error: "Aktuelles Passwort ist falsch" }

  const { error } = await supabase.auth.updateUser({ password: v.newPassword })
  if (error) {
    trackError("profile", "changePassword", error.message, { table: "auth" })
    return { error: error.message }
  }

  return { success: true }
}

export async function getLeaveRequests(): Promise<{ data: AnyRow[] | null; error: string | null }> {
  const { user, db } = await requireCompanyAuth()
  if (!user) return { data: null, error: "Nicht authentifiziert" }

  const { data, error } = await db
    .from("leave_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) return { data: [], error: null } // Table might not exist yet
  return { data: data ?? [], error: null }
}
