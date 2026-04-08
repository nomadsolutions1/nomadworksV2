"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"

const loginSchema = z.object({
  email: z.string().email("Ungueltige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort ist erforderlich"),
})

const registerSchema = z.object({
  email: z.string().email("Ungueltige E-Mail-Adresse"),
  password: z.string().min(8, "Mindestens 8 Zeichen"),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  companyName: z.string().min(1, "Firmenname ist erforderlich"),
})

export type AuthState = {
  error?: Record<string, string[]>
} | null

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validated = loginSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    trackError("auth", "login", error.message, { table: "auth" })
    return { error: { _form: ["E-Mail oder Passwort ist falsch"] } }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _form: ["Authentifizierungsfehler"] } }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const admin = createAdminClient()
    const meta = user.user_metadata || {}
    const companyName = meta.company_name || `${meta.first_name || "Neue"} Firma`

    const { data: company } = await admin
      .from("companies")
      .insert({
        name: companyName,
        plan: "trial",
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        max_employees: 5,
        is_active: true,
      })
      .select("id")
      .single()

    if (company) {
      await admin.from("profiles").insert({
        id: user.id,
        company_id: company.id,
        first_name: meta.first_name || "",
        last_name: meta.last_name || "",
        role: "owner",
      })
    }

    revalidatePath("/", "layout")
    redirect("/dashboard")
  }

  revalidatePath("/", "layout")

  if (profile?.role === "worker") {
    redirect("/stempeln")
  } else if (profile?.role === "super_admin") {
    redirect("/admin")
  } else {
    redirect("/dashboard")
  }
}

export async function register(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validated = registerSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = await createClient()
  const { error: signUpError } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        first_name: validated.data.firstName,
        last_name: validated.data.lastName,
        company_name: validated.data.companyName,
      },
    },
  })

  if (signUpError) {
    trackError("auth", "register", signUpError.message, { table: "auth" })
    return { error: { _form: [signUpError.message] } }
  }

  redirect("/verify")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://nomadworks.vercel.app"}/auth/callback?next=/update-password`,
  })
  return { success: true }
}

export async function updatePassword(newPassword: string): Promise<{ success?: boolean; error?: string }> {
  if (newPassword.length < 8) return { error: "Mindestens 8 Zeichen" }
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}
