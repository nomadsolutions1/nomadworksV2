"use server"

import { withAuth } from "@/lib/utils/auth-helper"

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

  const BOM = "\uFEFF"
  const header = ["Mitarbeiter", "Bruttolohn", "Urlaub", "Berufsbildung", "Rente", "Gesamt"].join(";")

  const fmt = (n: number) => n.toFixed(2).replace(".", ",")

  const rows = result.data.employees.map((e) =>
    [e.employeeName, fmt(e.grossWage), fmt(e.urlaubBeitrag), fmt(e.berufsbildungBeitrag), fmt(e.renteBeitrag), fmt(e.totalBeitrag)].join(";")
  )

  const t = result.data.totals
  const grossTotal = result.data.employees.reduce((s, e) => s + e.grossWage, 0)
  rows.push(["SUMME", fmt(grossTotal), fmt(t.urlaub), fmt(t.berufsbildung), fmt(t.rente), fmt(t.total)].join(";"))

  return { data: BOM + [header, ...rows].join("\r\n") }
}
