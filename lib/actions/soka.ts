"use server"

import { withAuth } from "@/lib/utils/auth-helper"
import { buildDatevCsv, datevFmtDate, datevFmtNumber } from "@/lib/utils/datev"
import { logActivity } from "@/lib/utils/activity-logger"
import { trackError } from "@/lib/utils/error-tracker"

type AnyRow = Record<string, unknown>

export type SokaCalculation = {
  employeeId: string
  employeeName: string
  jobTitle: string | null
  grossWage: number
  urlaubBeitrag: number
  berufsbildungBeitrag: number
  renteBeitrag: number
  totalBeitrag: number
}

export type SokaResult = {
  employees: SokaCalculation[]
  totals: { urlaub: number; berufsbildung: number; rente: number; total: number }
  rates: { urlaub: number; berufsbildung: number; rente: number }
  betriebskontoNr: string | null
  branchenkennziffer: string | null
}

export async function getSokaCalculations(
  month: string
): Promise<{ data?: SokaResult; error?: string }> {
  // FIX: v1 had no role check — now requires at least mitarbeiter read access
  return withAuth("mitarbeiter", "read", async ({ profile, db }) => {

  // Load company SOKA rates
  const { data: company } = await db
    .from("companies")
    .select("soka_umlagesatz_urlaub, soka_umlagesatz_berufsbildung, soka_umlagesatz_rente, soka_betriebskonto_nr, soka_branchenkennziffer")
    .eq("id", profile.company_id)
    .single()

  if (!company) return { error: "Firma nicht gefunden" }
  const c = company as AnyRow

  const urlaubRate = (c.soka_umlagesatz_urlaub as number) || 14.3
  const berufsbildungRate = (c.soka_umlagesatz_berufsbildung as number) || 2.6
  const renteRate = (c.soka_umlagesatz_rente as number) || 3.4

  // Load employees (except super_admin and employee without login)
  const { data: employees } = await db
    .from("profiles")
    .select("id, first_name, last_name, job_title, hourly_rate, monthly_salary, role")
    .eq("company_id", profile.company_id)
    .not("role", "in", "(super_admin,employee)")

  if (!employees) return { error: "Keine Mitarbeiter" }

  // Parse month
  const [year, monthNum] = month.split("-").map(Number)
  const monthStart = new Date(year, monthNum - 1, 1)
  const monthEnd = new Date(year, monthNum, 0, 23, 59, 59)

  const calculations: SokaCalculation[] = []

  for (const emp of employees as AnyRow[]) {
    let grossWage = 0

    if (emp.monthly_salary && Number(emp.monthly_salary) > 0) {
      grossWage = Number(emp.monthly_salary)
    } else if (emp.hourly_rate && Number(emp.hourly_rate) > 0) {
      // Calculate from time entries
      const { data: entries } = await db
        .from("time_entries")
        .select("clock_in, clock_out, break_minutes")
        .eq("user_id", emp.id as string)
        .gte("clock_in", monthStart.toISOString())
        .lte("clock_in", monthEnd.toISOString())
        .not("clock_out", "is", null)

      if (entries) {
        let totalMinutes = 0
        for (const e of entries as AnyRow[]) {
          const start = new Date(e.clock_in as string)
          const end = new Date(e.clock_out as string)
          const worked = (end.getTime() - start.getTime()) / 60000
          totalMinutes += worked - ((e.break_minutes as number) || 0)
        }
        grossWage = (totalMinutes / 60) * Number(emp.hourly_rate)
      }
    }

    if (grossWage <= 0) continue

    const urlaubBeitrag = grossWage * urlaubRate / 100
    const berufsbildungBeitrag = grossWage * berufsbildungRate / 100
    const renteBeitrag = grossWage * renteRate / 100

    calculations.push({
      employeeId: emp.id as string,
      employeeName: `${emp.first_name} ${emp.last_name}`,
      jobTitle: (emp.job_title as string) || null,
      grossWage,
      urlaubBeitrag,
      berufsbildungBeitrag,
      renteBeitrag,
      totalBeitrag: urlaubBeitrag + berufsbildungBeitrag + renteBeitrag,
    })
  }

  const totals = {
    urlaub: calculations.reduce((s, c) => s + c.urlaubBeitrag, 0),
    berufsbildung: calculations.reduce((s, c) => s + c.berufsbildungBeitrag, 0),
    rente: calculations.reduce((s, c) => s + c.renteBeitrag, 0),
    total: calculations.reduce((s, c) => s + c.totalBeitrag, 0),
  }

  return {
    data: {
      employees: calculations,
      totals,
      rates: { urlaub: urlaubRate, berufsbildung: berufsbildungRate, rente: renteRate },
      betriebskontoNr: (c.soka_betriebskonto_nr as string) || null,
      branchenkennziffer: (c.soka_branchenkennziffer as string) || null,
    },
  }
  }) as Promise<{ data?: SokaResult; error?: string }>
}

// ─── exportSokaCSV ───────────────────────────────────────────

export async function exportSokaCSV(month: string): Promise<{ data?: string; error?: string }> {
  const result = await getSokaCalculations(month)
  if (result.error || !result.data) return { error: result.error || "Keine Daten" }

  const header = ["Mitarbeiter", "Bruttolohn", "Urlaub", "Berufsbildung", "Rente", "Gesamt"]

  const rows: Array<Array<string | number>> = result.data.employees.map((e) => [
    e.employeeName,
    datevFmtNumber(e.grossWage),
    datevFmtNumber(e.urlaubBeitrag),
    datevFmtNumber(e.berufsbildungBeitrag),
    datevFmtNumber(e.renteBeitrag),
    datevFmtNumber(e.totalBeitrag),
  ])

  const t = result.data.totals
  const grossTotal = result.data.employees.reduce((s, e) => s + e.grossWage, 0)
  rows.push([
    "SUMME",
    datevFmtNumber(grossTotal),
    datevFmtNumber(t.urlaub),
    datevFmtNumber(t.berufsbildung),
    datevFmtNumber(t.rente),
    datevFmtNumber(t.total),
  ])

  return { data: buildDatevCsv(header, rows) }
}

// ─── exportSokaPDF (HTML für Druck/PDF) ──────────────────────

const MONTH_NAMES_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
]

function escHtml(s: string | number | null | undefined): string {
  if (s == null) return ""
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Erzeugt Druck-fertiges HTML zur SOKA-Meldung.
 * Wird sowohl für die /drucken-Seite genutzt als auch für einen
 * clientseitigen "Als PDF speichern"-Download.
 */
export async function exportSokaPDF(
  month: string
): Promise<{ data?: string; error?: string }> {
  return withAuth("mitarbeiter", "read", async ({ profile, db }) => {
    const result = await getSokaCalculations(month)
    if (result.error || !result.data) return { error: result.error || "Keine Daten" }

    const { data: company } = await db
      .from("companies")
      .select("name, address")
      .eq("id", profile.company_id)
      .single()

    const c = (company as AnyRow) || {}
    const [year, monthNum] = month.split("-").map(Number)
    const monthLabel = `${MONTH_NAMES_DE[monthNum - 1]} ${year}`
    const fmt = (n: number) =>
      new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n)

    const grossTotal = result.data.employees.reduce((s, e) => s + e.grossWage, 0)

    const rows = result.data.employees
      .map(
        (e) => `
      <tr>
        <td>${escHtml(e.employeeName)}</td>
        <td class="num">${fmt(e.grossWage)}</td>
        <td class="num">${fmt(e.urlaubBeitrag)}</td>
        <td class="num">${fmt(e.berufsbildungBeitrag)}</td>
        <td class="num">${fmt(e.renteBeitrag)}</td>
        <td class="num">${fmt(e.totalBeitrag)}</td>
      </tr>`
      )
      .join("")

    const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8" />
<title>SOKA-Bau Meldung — ${escHtml(monthLabel)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; color: #111; margin: 0; padding: 24px; }
  h1 { font-size: 18px; margin: 0; }
  .meta { color: #555; font-size: 11px; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; margin-top: 16px; }
  th, td { border: 1px solid #374151; padding: 4px 8px; text-align: left; }
  th { background: #f1f5f9; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  tr.sum { background: #f1f5f9; font-weight: 700; }
  .header { display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
  @media print { @page { size: A4; margin: 15mm; } }
</style></head>
<body>
  <div class="header">
    <div>
      <h1>${escHtml((c.name as string) || "Firma")}</h1>
      <div class="meta">${escHtml((c.address as string) || "")}</div>
    </div>
    <div style="text-align:right">
      <div style="font-weight:700">SOKA-Bau Meldung</div>
      <div class="meta">${escHtml(monthLabel)}</div>
    </div>
  </div>

  <div class="meta" style="margin-top:12px">
    ${result.data.betriebskontoNr ? `<div><strong>Betriebskonto-Nr:</strong> ${escHtml(result.data.betriebskontoNr)}</div>` : ""}
    ${result.data.branchenkennziffer ? `<div><strong>Branchenkennziffer:</strong> ${escHtml(result.data.branchenkennziffer)}</div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>Mitarbeiter</th>
        <th class="num">Bruttolohn</th>
        <th class="num">Urlaub (${result.data.rates.urlaub}%)</th>
        <th class="num">Berufsbildung (${result.data.rates.berufsbildung}%)</th>
        <th class="num">Rente (${result.data.rates.rente}%)</th>
        <th class="num">Gesamt</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="sum">
        <td>SUMME</td>
        <td class="num">${fmt(grossTotal)}</td>
        <td class="num">${fmt(result.data.totals.urlaub)}</td>
        <td class="num">${fmt(result.data.totals.berufsbildung)}</td>
        <td class="num">${fmt(result.data.totals.rente)}</td>
        <td class="num">${fmt(result.data.totals.total)}</td>
      </tr>
    </tbody>
  </table>
</body></html>`

    return { data: html }
  }) as Promise<{ data?: string; error?: string }>
}

// ─── exportDatevTimeEntries ──────────────────────────────────
// DATEV-kompatibler Export der Zeiteinträge (Lohnbuchhaltung).
// Owner + Accountant mit Leserecht auf Mitarbeiter.

export async function exportDatevTimeEntries(
  from: string,
  to: string
): Promise<{ data?: string; error?: string }> {
  return withAuth("mitarbeiter", "read", async ({ user, profile, db }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return { error: "Ungültiger Zeitraum. Bitte Start- und Enddatum auswählen." }
    }

    const fromDate = new Date(`${from}T00:00:00`)
    const toDate = new Date(`${to}T23:59:59`)
    if (fromDate > toDate) return { error: "Startdatum liegt nach dem Enddatum." }

    const { data: entries, error } = await db
      .from("time_entries")
      .select("id, user_id, clock_in, clock_out, break_minutes, site_id")
      .eq("company_id", profile.company_id)
      .gte("clock_in", fromDate.toISOString())
      .lte("clock_in", toDate.toISOString())
      .not("clock_out", "is", null)
      .order("clock_in", { ascending: true })

    if (error) {
      trackError("soka", "exportDatevTimeEntries", error.message, { table: "time_entries" })
      return { error: "Zeiteinträge konnten nicht geladen werden." }
    }

    const userIds = Array.from(new Set((entries ?? []).map((e) => e.user_id).filter(Boolean) as string[]))
    const siteIds = Array.from(new Set((entries ?? []).map((e) => e.site_id).filter(Boolean) as string[]))

    const [{ data: profiles }, { data: sites }] = await Promise.all([
      userIds.length
        ? db.from("profiles").select("id, first_name, last_name, hourly_rate").in("id", userIds).eq("company_id", profile.company_id)
        : Promise.resolve({ data: [] as AnyRow[] }),
      siteIds.length
        ? db.from("construction_sites").select("id, name").in("id", siteIds).eq("company_id", profile.company_id)
        : Promise.resolve({ data: [] as AnyRow[] }),
    ])

    const profileMap = new Map<string, AnyRow>()
    for (const p of (profiles ?? []) as AnyRow[]) profileMap.set(p.id as string, p)
    const siteMap = new Map<string, string>()
    for (const s of (sites ?? []) as AnyRow[]) siteMap.set(s.id as string, (s.name as string) || "")

    const header = [
      "Datum",
      "Mitarbeiter",
      "Baustelle",
      "Beginn",
      "Ende",
      "Pause (Min)",
      "Stunden",
      "Stundensatz",
      "Betrag",
    ]

    const rows: Array<Array<string | number>> = []
    for (const e of (entries ?? []) as AnyRow[]) {
      const start = new Date(e.clock_in as string)
      const end = new Date(e.clock_out as string)
      const breakMin = (e.break_minutes as number) || 0
      const workedMin = (end.getTime() - start.getTime()) / 60000 - breakMin
      const hours = workedMin / 60
      const emp = profileMap.get(e.user_id as string)
      const rate = emp ? Number(emp.hourly_rate || 0) : 0
      const amount = hours * rate
      const fullName = emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() : "—"
      rows.push([
        datevFmtDate(start),
        fullName,
        siteMap.get(e.site_id as string) || "—",
        start.toTimeString().slice(0, 5),
        end.toTimeString().slice(0, 5),
        String(breakMin),
        datevFmtNumber(hours),
        datevFmtNumber(rate),
        datevFmtNumber(amount),
      ])
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "export",
      entityType: "time_entries",
      entityId: "datev",
      title: `DATEV-Zeiten exportiert (${from} – ${to})`,
    })

    return { data: buildDatevCsv(header, rows) }
  }) as Promise<{ data?: string; error?: string }>
}
