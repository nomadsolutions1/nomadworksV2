"use server"

import { requireCompanyAuth } from "@/lib/utils/auth-helper"
import { trackError } from "@/lib/utils/error-tracker"

// ─── Types ────────────────────────────────────────────────────

export type Tip = {
  key: string
  message: string
  link: string
  linkText: string
  severity: "info" | "warning"
  module?: string
}

type AnyRow = Record<string, unknown>

// ─── Tip Definitions ──────────────────────────────────────────

const DATA_TIPS: {
  key: string
  module: string
  message: (count: number) => string
  link: string
  linkText: string
  severity: "info" | "warning"
  check: (db: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>, companyId: string) => Promise<number>
}[] = [
  {
    key: "employees-no-rate",
    module: "mitarbeiter",
    message: (n) => `${n} Mitarbeiter haben keinen Stundensatz hinterlegt. Ohne Stundensatz keine automatische Kostenberechnung.`,
    link: "/mitarbeiter",
    linkText: "Stundensätze hinterlegen",
    severity: "warning",
    check: async (db, companyId) => {
      const { count } = await db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .is("hourly_rate", null)
        .neq("role", "super_admin")
      return count ?? 0
    },
  },
  {
    key: "sites-no-budget",
    module: "baustellen",
    message: (n) => `${n} Baustellen haben kein Budget hinterlegt. Ohne Budget keine Kostenüberwachung.`,
    link: "/baustellen",
    linkText: "Budget hinterlegen",
    severity: "warning",
    check: async (db, companyId) => {
      const { count } = await db
        .from("construction_sites")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "active")
        .is("budget", null)
      return count ?? 0
    },
  },
  {
    key: "equipment-no-rate",
    module: "fuhrpark",
    message: (n) => `${n} Geräte haben keinen Tagessatz. Ohne Tagessatz keine automatische Gerätekosten-Berechnung.`,
    link: "/fuhrpark/maschinen",
    linkText: "Tagessaetze hinterlegen",
    severity: "warning",
    check: async (db, companyId) => {
      const { count } = await db
        .from("equipment")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .is("daily_rate", null)
        .is("deleted_at", null)
      return count ?? 0
    },
  },
  {
    key: "subs-no-cert",
    module: "subunternehmer",
    message: (n) => `${n} Subunternehmer: Freistellungsbescheinigung fehlt oder abgelaufen.`,
    link: "/subunternehmer",
    linkText: "Bescheinigungen prüfen",
    severity: "warning",
    check: async (db, companyId) => {
      const today = new Date().toISOString().split("T")[0]
      const { count } = await db
        .from("subcontractors")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .or(`tax_exemption_expiry.is.null,tax_exemption_expiry.lt.${today}`)
      return count ?? 0
    },
  },
  {
    key: "vehicles-tuev",
    module: "fuhrpark",
    message: (n) => `${n} Fahrzeuge: TÜV läuft in den nächsten 30 Tagen ab.`,
    link: "/fuhrpark/fahrzeuge",
    linkText: "TÜV-Termine prüfen",
    severity: "warning",
    check: async (db, companyId) => {
      const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      const today = new Date().toISOString().split("T")[0]
      const { count } = await db
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .lte("next_inspection", thirtyDays)
        .gte("next_inspection", today)
      return count ?? 0
    },
  },
  {
    key: "stock-low",
    module: "lager",
    message: (n) => `${n} Materialien unter Mindestbestand.`,
    link: "/lager",
    linkText: "Lagerbestände prüfen",
    severity: "warning",
    check: async (db, companyId) => {
      const { data } = await db
        .from("materials")
        .select("id, current_stock, min_stock")
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .not("min_stock", "is", null)
      const rows = (data as AnyRow[] | null) || []
      return rows.filter((r) => (r.current_stock as number) < (r.min_stock as number)).length
    },
  },
]

// Onboarding tips — shown once on first visit
const ONBOARDING_TIPS: Tip[] = [
  { key: "onboard-dashboard", module: "dashboard", severity: "info", message: "Ihr Dashboard zeigt alle wichtigen Kennzahlen auf einen Blick. Die Warnungen oben zeigen was Ihre Aufmerksamkeit braucht.", link: "", linkText: "" },
  { key: "onboard-mitarbeiter", module: "mitarbeiter", severity: "info", message: "Hier verwalten Sie Ihr Team. Legen Sie Stundensätze fest — damit berechnet NomadWorks automatisch Ihre Personalkosten.", link: "", linkText: "" },
  { key: "onboard-baustellen", module: "baustellen", severity: "info", message: "Jede Baustelle sammelt automatisch Kosten aus Zeiterfassung, Material und Geräten. Hinterlegen Sie ein Budget für die Kostenüberwachung.", link: "", linkText: "" },
  { key: "onboard-disposition", module: "disposition", severity: "info", message: "Weisen Sie Mitarbeiter per Drag & Drop Baustellen zu. Die Zuweisung erscheint automatisch in der Stempeluhr des Bauarbeiters.", link: "", linkText: "" },
  { key: "onboard-auftraege", module: "auftraege", severity: "info", message: "Vom Angebot bis zur Abrechnung — verfolgen Sie jeden Auftrag mit automatischer Nachkalkulation.", link: "", linkText: "" },
  { key: "onboard-fuhrpark", module: "fuhrpark", severity: "info", message: "Fahrzeuge und Maschinen verwalten, TÜV-Termine im Blick behalten, Werkstatt-Aufträge tracken.", link: "", linkText: "" },
  { key: "onboard-lager", module: "lager", severity: "info", message: "Material einbuchen, entnehmen, Mindestbestände überwachen. Entnahmen fließen automatisch in die Baustellenkosten.", link: "", linkText: "" },
  { key: "onboard-rechnungen", module: "rechnungen", severity: "info", message: "Rechnungen aus Aufträgen generieren, Mahnwesen nutzen, Zahlungseingänge verbuchen.", link: "", linkText: "" },
]

// ─── Actions ──────────────────────────────────────────────────

export async function getContextualTips(module?: string): Promise<{ data: Tip[] }> {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { data: [] }

  // Load dismissed tips for this user
  const { data: dismissed } = await db
    .from("dismissed_tips")
    .select("tip_key")
    .eq("user_id", user.id)

  const dismissedKeys = new Set((dismissed as AnyRow[] | null)?.map((r) => r.tip_key as string) || [])

  const tips: Tip[] = []

  // Check data-driven tips
  const relevantDataTips = module
    ? DATA_TIPS.filter((t) => t.module === module)
    : DATA_TIPS

  const checks = await Promise.all(
    relevantDataTips
      .filter((t) => !dismissedKeys.has(t.key))
      .map(async (t) => {
        const count = await t.check(db, profile.company_id)
        if (count > 0) {
          return {
            key: t.key,
            message: t.message(count),
            link: t.link,
            linkText: t.linkText,
            severity: t.severity,
            module: t.module,
          } satisfies Tip
        }
        return null
      })
  )
  for (const t of checks) {
    if (t !== null) tips.push(t)
  }

  // Check onboarding tips
  const relevantOnboarding = module
    ? ONBOARDING_TIPS.filter((t) => t.module === module)
    : ONBOARDING_TIPS

  for (const tip of relevantOnboarding) {
    if (!dismissedKeys.has(tip.key)) {
      tips.push(tip)
    }
  }

  return { data: tips }
}

export async function dismissTip(tipKey: string): Promise<{ success: boolean }> {
  const { user, db } = await requireCompanyAuth()
  if (!user) return { success: false }

  const { error } = await db
    .from("dismissed_tips")
    .insert({
      user_id: user.id,
      tip_key: tipKey,
    })

  if (error) {
    trackError("tips", "dismissTip", error.message, { table: "dismissed_tips" })
    return { success: false }
  }

  return { success: true }
}
