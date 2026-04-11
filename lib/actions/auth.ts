"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort ist erforderlich"),
})

const registerSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
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

  // SECURITY: Company + Profile werden ausschließlich im /auth/callback nach
  // Email-Verification erstellt, nicht hier im Login-Flow. Früher hat dieser
  // Block anonyme Firmen-Erstellung erlaubt (Spam-Pfad) — entfernt April 2026.
  if (!profile) {
    return { error: { _form: ["Kein Profil für diese Email gefunden. Bitte registrieren oder eine Einladung anfordern."] } }
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
