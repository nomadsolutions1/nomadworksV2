"use server"

import { withAuth } from "@/lib/utils/auth-helper"
import { trackError } from "@/lib/utils/error-tracker"
import { buildProfileNameMap, buildSiteNameMap } from "@/lib/utils/shared-queries"

// ─── KPI Data ────────────────────────────────────────────────

export type DashboardKPIs = {
  employees: { total: number; active: number; sick: number; vacation: number }
  sites: { total: number; active: number; paused: number }
  orders: { total: number; offers: number; inProgress: number; completed: number }
  hoursToday: { total: number; clockedIn: number }
  revenueMonth: { total: number; invoiceCount: number; openCount: number }
  openInvoices: { total: number; count: number; overdueCount: number }
}

const EMPTY_KPIS: DashboardKPIs = {
  employees: { total: 0, active: 0, sick: 0, vacation: 0 },
  sites: { total: 0, active: 0, paused: 0 },
  orders: { total: 0, offers: 0, inProgress: 0, completed: 0 },
  hoursToday: { total: 0, clockedIn: 0 },
  revenueMonth: { total: 0, invoiceCount: 0, openCount: 0 },
  openInvoices: { total: 0, count: 0, overdueCount: 0 },
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const result = await withAuth(null, "read", async ({ profile, db }) => {
    // Workers should not see dashboard data
    if (profile.role === "worker" || profile.role === "employee") {
      return EMPTY_KPIS
    }

    const companyId = profile.company_id
    const today = new Date().toISOString().split("T")[0]
    const monthStart = `${today.slice(0, 7)}-01`

    // All queries in parallel — ALL filtered by company_id
    const [
      profilesRes, sickRes, leaveRes, sitesRes,
      ordersRes, timeRes, invoicesMonthRes, invoicesOpenRes,
    ] = await Promise.all([
      db.from("profiles").select("id, role", { count: "exact" })
        .eq("company_id", companyId),
      db.from("sick_days").select("id", { count: "exact" })
        .eq("company_id", companyId).lte("start_date", today).gte("end_date", today),
      db.from("leave_requests").select("id", { count: "exact" })
        .eq("company_id", companyId).eq("status", "approved").eq("type", "vacation")
        .lte("start_date", today).gte("end_date", today),
      db.from("construction_sites").select("id, status")
        .eq("company_id", companyId),
      db.from("orders").select("id, status, budget")
        .eq("company_id", companyId).is("deleted_at", null),
      db.from("time_entries").select("id, user_id, clock_in, clock_out, break_minutes")
        .eq("company_id", companyId).gte("clock_in", `${today}T00:00:00`).lte("clock_in", `${today}T23:59:59`),
      db.from("invoices").select("id, status, total, paid_amount")
        .eq("company_id", companyId).gte("invoice_date", monthStart),
      db.from("invoices").select("id, status, total, paid_amount, due_date")
        .eq("company_id", companyId).in("status", ["draft", "sent", "overdue"]),
    ])

    // Process employees
    const profiles = profilesRes.data ?? []
    const totalEmployees = profiles.length
    const sickCount = (sickRes.data ?? []).length
    const vacationCount = (leaveRes.data ?? []).length
    const activeEmployees = totalEmployees - sickCount - vacationCount

    // Process sites
    const sites = sitesRes.data ?? []
    const activeSites = sites.filter((s) => s.status === "active").length
    const pausedSites = sites.filter((s) => s.status === "paused").length

    // Process orders
    const orders = ordersRes.data ?? []
    const offers = orders.filter((o) => o.status === "offer").length
    const inProgressOrders = orders.filter((o) =>
      o.status === "in_progress" || o.status === "commissioned"
    ).length
    const completedOrders = orders.filter((o) => o.status === "completed").length

    // Process time entries
    const timeEntries = timeRes.data ?? []
    const clockedIn = timeEntries.filter((t) => t.clock_out === null).length
    let totalMinutesToday = 0
    for (const entry of timeEntries) {
      const clockIn = new Date(entry.clock_in)
      const clockOut = entry.clock_out ? new Date(entry.clock_out) : new Date()
      const minutes = (clockOut.getTime() - clockIn.getTime()) / 60000 - (entry.break_minutes ?? 0)
      totalMinutesToday += Math.max(0, minutes)
    }
    const hoursToday = Math.round(totalMinutesToday / 60)

    // Process invoices
    const monthInvoices = invoicesMonthRes.data ?? []
    const revenueTotal = monthInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const openInvoiceCount = monthInvoices.filter((i) => i.status !== "paid").length

    const openInvoices = invoicesOpenRes.data ?? []
    const openTotal = openInvoices.reduce((sum, inv) => sum + Number(inv.total || 0) - Number(inv.paid_amount || 0), 0)
    const overdueCount = openInvoices.filter((i) => {
      if (!i.due_date) return false
      return new Date(i.due_date) < new Date()
    }).length

    return {
      employees: { total: totalEmployees, active: activeEmployees, sick: sickCount, vacation: vacationCount },
      sites: { total: sites.length, active: activeSites, paused: pausedSites },
      orders: { total: orders.length, offers, inProgress: inProgressOrders, completed: completedOrders },
      hoursToday: { total: hoursToday, clockedIn },
      revenueMonth: { total: revenueTotal, invoiceCount: monthInvoices.length, openCount: openInvoiceCount },
      openInvoices: { total: openTotal, count: openInvoices.length, overdueCount },
    }
  })

  if (!result || "error" in result) return EMPTY_KPIS
  return result as DashboardKPIs
}

// ─── Warnings ────────────────────────────────────────────────

export type DashboardWarning = {
  id: string
  message: string
  severity: "danger" | "warning"
  link: string
}

export async function getDashboardWarnings(): Promise<DashboardWarning[]> {
  const result = await withAuth(null, "read", async ({ profile, db }) => {
    if (profile.role === "worker" || profile.role === "employee") {
      return [] as DashboardWarning[]
    }

    const companyId = profile.company_id
    const today = new Date()
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const todayStr = today.toISOString().split("T")[0]

    const warnings: DashboardWarning[] = []

    // Expiring qualifications (within 30 days)
    const { data: expiringQuals } = await db.from("qualifications")
      .select("id, name, expiry_date, user_id")
      .eq("company_id", companyId)
      .lte("expiry_date", in30Days)
      .gte("expiry_date", todayStr)

    const qualCount = (expiringQuals ?? []).length
    if (qualCount > 0) {
      warnings.push({
        id: "qual-expiring",
        message: `${qualCount} Qualifikation${qualCount > 1 ? "en" : ""} ${qualCount > 1 ? "laufen" : "läuft"} in 30 Tagen ab`,
        severity: "warning",
        link: "/mitarbeiter",
      })
    }

    // Expired qualifications
    const { data: expiredQuals } = await db.from("qualifications")
      .select("id", { count: "exact" })
      .eq("company_id", companyId)
      .lt("expiry_date", todayStr)

    const expiredCount = (expiredQuals ?? []).length
    if (expiredCount > 0) {
      warnings.push({
        id: "qual-expired",
        message: `${expiredCount} Qualifikation${expiredCount > 1 ? "en" : ""} ${expiredCount > 1 ? "sind" : "ist"} abgelaufen!`,
        severity: "danger",
        link: "/mitarbeiter",
      })
    }

    // TUeV warnings (vehicles with next_inspection within 30 days)
    const { data: tuevVehicles } = await db.from("vehicles")
      .select("id, license_plate, make, model, next_inspection")
      .eq("company_id", companyId)
      .lte("next_inspection", in30Days)
      .gte("next_inspection", todayStr)
      .is("deleted_at", null)

    for (const v of tuevVehicles ?? []) {
      const daysLeft = Math.ceil((new Date(v.next_inspection!).getTime() - today.getTime()) / 86400000)
      warnings.push({
        id: `tuev-${v.id}`,
        message: `TÜV für ${v.make} ${v.model} (${v.license_plate}) in ${daysLeft} Tagen fällig`,
        severity: daysLeft <= 14 ? "danger" : "warning",
        link: "/fuhrpark/fahrzeuge",
      })
    }

    // Low stock materials (current_stock < min_stock)
    const { data: lowStock } = await db.from("materials")
      .select("id, name, current_stock, min_stock")
      .eq("company_id", companyId)
      .is("deleted_at", null)

    const lowStockItems = (lowStock ?? []).filter(
      (m) => m.min_stock != null && m.current_stock != null && Number(m.current_stock) < Number(m.min_stock)
    )
    if (lowStockItems.length > 0) {
      warnings.push({
        id: "low-stock",
        message: `Mindestbestand unterschritten: ${lowStockItems.map((m) => m.name).join(", ")}`,
        severity: "warning",
        link: "/lager",
      })
    }

    // Overdue invoices
    const { data: overdueInv } = await db.from("invoices")
      .select("id, invoice_number, total, due_date")
      .eq("company_id", companyId)
      .in("status", ["sent", "overdue"])
      .lt("due_date", todayStr)

    const overdueList = overdueInv ?? []
    if (overdueList.length > 0) {
      const totalOverdue = overdueList.reduce((s, i) => s + Number(i.total || 0), 0)
      warnings.push({
        id: "overdue-invoices",
        message: `${overdueList.length} überfällige Rechnung${overdueList.length > 1 ? "en" : ""} (${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(totalOverdue)})`,
        severity: "danger",
        link: "/rechnungen",
      })
    }

    // Reverse Charge certificates expiring
    const { data: expiringRC } = await db.from("subcontractors")
      .select("id, name, reverse_charge_certificate_valid_until")
      .eq("company_id", companyId)
      .eq("reverse_charge_13b", true)
      .lte("reverse_charge_certificate_valid_until", in30Days)
      .gte("reverse_charge_certificate_valid_until", todayStr)
      .is("deleted_at", null)

    for (const s of expiringRC ?? []) {
      const daysLeft = Math.ceil((new Date(s.reverse_charge_certificate_valid_until!).getTime() - today.getTime()) / 86400000)
      warnings.push({
        id: `rc13b-${s.id}`,
        message: `§13b-Nachweis von "${s.name}" läuft in ${daysLeft} Tagen ab`,
        severity: daysLeft <= 14 ? "danger" : "warning",
        link: `/subunternehmer/${s.id}`,
      })
    }

    return warnings.sort((a, b) => (a.severity === "danger" ? -1 : 1) - (b.severity === "danger" ? -1 : 1))
  })

  if (!result || "error" in result) return []
  return result as DashboardWarning[]
}

// ─── Clocked-In Employees ────────────────────────────────────

export type ClockedInEmployee = {
  id: string
  name: string
  siteName: string | null
  clockIn: string
}

export async function getClockedInEmployees(): Promise<ClockedInEmployee[]> {
  const result = await withAuth(null, "read", async ({ profile, db }) => {
    if (profile.role === "worker" || profile.role === "employee") {
      return [] as ClockedInEmployee[]
    }

    const companyId = profile.company_id
    const today = new Date().toISOString().split("T")[0]

    const { data: entries } = await db.from("time_entries")
      .select("id, user_id, site_id, clock_in")
      .eq("company_id", companyId)
      .is("clock_out", null)
      .gte("clock_in", `${today}T00:00:00`)
      .order("clock_in", { ascending: true })

    const timeEntries = entries ?? []
    if (timeEntries.length === 0) return [] as ClockedInEmployee[]

    // Get names via shared utilities
    const userIds = [...new Set(timeEntries.map((t) => t.user_id))]
    const siteIds = [...new Set(timeEntries.filter((t) => t.site_id).map((t) => t.site_id as string))]

    const [profileMap, siteMap] = await Promise.all([
      buildProfileNameMap(db, companyId, userIds),
      siteIds.length > 0 ? buildSiteNameMap(db, companyId, siteIds) : Promise.resolve(new Map<string, string>()),
    ])

    return timeEntries.map((t) => ({
      id: t.id,
      name: profileMap.get(t.user_id) || "Unbekannt",
      siteName: t.site_id ? siteMap.get(t.site_id) || null : null,
      clockIn: t.clock_in,
    }))
  })

  if (!result || "error" in result) return []
  return result as ClockedInEmployee[]
}

// ─── Activity Feed ───────────────────────────────────────────

export type ActivityItem = {
  id: string
  message: string
  timestamp: string
  type: "info" | "success" | "warning" | "danger"
}

export async function getActivityFeed(limit = 15): Promise<ActivityItem[]> {
  const result = await withAuth(null, "read", async ({ profile, db }) => {
    if (profile.role === "worker" || profile.role === "employee") {
      return [] as ActivityItem[]
    }

    const { data: logs, error } = await db.from("activity_log")
      .select("id, action, entity_type, title, created_at")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      trackError("dashboard", "getActivityFeed", error.message, { table: "activity_log" })
      return [] as ActivityItem[]
    }

    return (logs ?? []).map((log) => {
      const action = (log.action || "").toLowerCase()
      let type: ActivityItem["type"] = "info"
      if (action.includes("create") || action.includes("complete") || action.includes("paid")) {
        type = "success"
      } else if (action.includes("delete") || action.includes("cancel")) {
        type = "danger"
      } else if (action.includes("warn") || action.includes("overdue")) {
        type = "warning"
      }

      return {
        id: log.id,
        message: log.title,
        timestamp: log.created_at,
        type,
      }
    })
  })

  if (!result || "error" in result) return []
  return result as ActivityItem[]
}

// ─── Onboarding Status ──────────────────────────────────────

export type OnboardingStatus = {
  companyDataComplete: boolean
  hasEmployees: boolean
  hasSites: boolean
  hasOrders: boolean
  hasInvoices: boolean
  allComplete: boolean
}

const EMPTY_ONBOARDING: OnboardingStatus = {
  companyDataComplete: false, hasEmployees: false, hasSites: false,
  hasOrders: false, hasInvoices: false, allComplete: false,
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const result = await withAuth(null, "read", async ({ profile, db }) => {
    const companyId = profile.company_id

    const [companyRes, employeesRes, sitesRes, ordersRes, invoicesRes] = await Promise.all([
      db.from("companies").select("name, address, bank_iban").eq("id", companyId).single(),
      db.from("profiles").select("id", { count: "exact" }).eq("company_id", companyId),
      db.from("construction_sites").select("id", { count: "exact" }).eq("company_id", companyId),
      db.from("orders").select("id", { count: "exact" }).eq("company_id", companyId).is("deleted_at", null),
      db.from("invoices").select("id", { count: "exact" }).eq("company_id", companyId),
    ])

    const company = companyRes.data
    const companyDataComplete = !!(company?.name && company?.address)
    const hasEmployees = (employeesRes.data ?? []).length > 1 // >1 because owner counts
    const hasSites = (sitesRes.data ?? []).length > 0
    const hasOrders = (ordersRes.data ?? []).length > 0
    const hasInvoices = (invoicesRes.data ?? []).length > 0
    const allComplete = companyDataComplete && hasEmployees && hasSites && hasOrders && hasInvoices

    return { companyDataComplete, hasEmployees, hasSites, hasOrders, hasInvoices, allComplete }
  })

  if (!result || "error" in result) return EMPTY_ONBOARDING
  return result as OnboardingStatus
}

// ─── Trial Status ────────────────────────────────────────────

export type TrialStatus = {
  isOnTrial: boolean
  daysLeft: number
  plan: string
} | null

export async function getTrialStatus(): Promise<TrialStatus> {
  const result = await withAuth(null, "read", async ({ profile, db }) => {
    const { data: company } = await db.from("companies")
      .select("plan, trial_ends_at")
      .eq("id", profile.company_id)
      .single() as { data: { plan: string; trial_ends_at: string | null } | null }

    if (!company) return null

    if (company.plan !== "trial" || !company.trial_ends_at) {
      return { isOnTrial: false, daysLeft: 0, plan: company.plan }
    }

    const trialEnd = new Date(company.trial_ends_at)
    const now = new Date()
    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000))

    return { isOnTrial: true, daysLeft, plan: company.plan }
  })

  if (!result || "error" in result) return null
  return result as TrialStatus
}

// ─── Current User Name ──────────────────────────────────────

export async function getCurrentUserFirstName(): Promise<string> {
  const result = await withAuth(null, "read", async ({ user, db }) => {
    const { data: profileData } = await db.from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single() as { data: { first_name: string } | null }

    return profileData?.first_name || ""
  })

  if (!result || typeof result === "object" && "error" in result) return ""
  return result as string
}
