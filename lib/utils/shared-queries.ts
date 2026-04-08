"use server"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database"

/**
 * Build a name map from profiles table: id -> "first_name last_name"
 * Used in 5+ actions to resolve user IDs to display names.
 */
export async function buildProfileNameMap(
  db: SupabaseClient<Database>,
  companyId: string,
  userIds?: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>()

  const query = db
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("company_id", companyId)

  const { data } = userIds && userIds.length > 0
    ? await query.in("id", userIds)
    : await query

  for (const p of data ?? []) {
    map.set(p.id, `${p.first_name} ${p.last_name}`)
  }

  return map
}

/**
 * Build a name map from construction_sites table: id -> name
 */
export async function buildSiteNameMap(
  db: SupabaseClient<Database>,
  companyId: string,
  siteIds?: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>()

  const query = db
    .from("construction_sites")
    .select("id, name")
    .eq("company_id", companyId)

  const { data } = siteIds && siteIds.length > 0
    ? await query.in("id", siteIds)
    : await query

  for (const s of data ?? []) {
    map.set(s.id, s.name)
  }

  return map
}

/**
 * Build a name map from customers table: id -> name
 */
export async function buildCustomerNameMap(
  db: SupabaseClient<Database>,
  companyId: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>()

  const { data } = await db
    .from("customers")
    .select("id, name")
    .eq("company_id", companyId)

  for (const c of data ?? []) {
    map.set(c.id, c.name)
  }

  return map
}
