"use server"

import { requireCompanyAuth } from "@/lib/utils/auth-helper"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"

// ─── Types ────────────────────────────────────────────────────

export type Notification = {
  id: string
  company_id: string
  user_id: string | null
  type: string
  title: string
  message: string
  severity: string
  link: string | null
  read_at: string | null
  created_at: string
}

// ─── Actions ──────────────────────────────────────────────────

export async function getNotifications(): Promise<{ data: Notification[] | null; error: string | null }> {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { data: null, error: "Nicht authentifiziert" }

  // Build query - workers see only their own, managers see all company notifications
  let query = db
    .from("notifications")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (profile.role === "worker") {
    query = query.or(`user_id.eq.${user.id},user_id.is.null`)
  }

  const { data, error } = await query

  if (error) return { data: [], error: null } // Table might not exist
  return { data: data ?? [], error: null }
}

export async function getUnreadCount(): Promise<{ count: number; error: string | null }> {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { count: 0, error: null }

  let query = db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("company_id", profile.company_id)
    .is("read_at", null)

  if (profile.role === "worker") {
    query = query.or(`user_id.eq.${user.id},user_id.is.null`)
  }

  const { count, error } = await query

  if (error) return { count: 0, error: null }
  return { count: count ?? 0, error: null }
}

export async function markAsRead(id: string): Promise<{ success?: boolean; error?: string }> {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { error: "Nicht authentifiziert" }

  const { error } = await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", profile.company_id)

  if (error) {
    trackError("notifications", "markAsRead", error.message, { table: "notifications" })
    return { error: error.message }
  }

  revalidatePath("/benachrichtigungen")
  return { success: true }
}

export async function markAllAsRead(): Promise<{ success?: boolean; error?: string }> {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { error: "Nicht authentifiziert" }

  let query = db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("company_id", profile.company_id)
    .is("read_at", null)

  // Workers can only mark their own notifications as read
  if (profile.role === "worker") {
    query = query.or(`user_id.eq.${user.id},user_id.is.null`)
  }

  const { error } = await query

  if (error) {
    trackError("notifications", "markAllAsRead", error.message, { table: "notifications" })
    return { error: error.message }
  }

  revalidatePath("/benachrichtigungen")
  return { success: true }
}
