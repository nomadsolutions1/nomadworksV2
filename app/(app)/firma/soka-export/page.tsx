import { getSokaCalculations } from "@/lib/actions/soka"
import { requireCompanyAuth } from "@/lib/utils/auth-helper"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { SokaExportClient } from "@/components/modules/company/soka-export-client"

export const metadata: Metadata = { title: "SOKA-Bau Export" }

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
]

export default async function SokaExportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const selectedMonth =
    month ||
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`

  const { user, profile } = await requireCompanyAuth()
  if (!user || !profile) redirect("/login")

  const { data: soka, error } = await getSokaCalculations(selectedMonth)

  const [year, monthNum] = selectedMonth.split("-").map(Number)
  const monthLabel = `${MONTHS[monthNum - 1]} ${year}`
  const fmt = (n: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n)

  const grossTotal = soka?.employees.reduce((s, e) => s + e.grossWage, 0) ?? 0

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SOKA-Bau Meldung</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monatliche Meldung an die Sozialkasse der Bauwirtschaft. Wählen Sie einen Monat und
            laden Sie die CSV-Datei für das SOKA-Portal herunter oder drucken Sie die Meldung.
          </p>
        </div>
        <Link
          href="/firma"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Zurück
        </Link>
      </div>

      <SokaExportClient
        selectedMonth={selectedMonth}
        monthLabel={monthLabel}
        hasError={!!error}
        errorMessage={error}
        employees={soka?.employees ?? []}
        totals={
          soka?.totals ?? { urlaub: 0, berufsbildung: 0, rente: 0, total: 0 }
        }
        rates={soka?.rates ?? { urlaub: 0, berufsbildung: 0, rente: 0 }}
        grossTotal={grossTotal}
        fmtCurrencyNumbers={{
          employees: (soka?.employees ?? []).map((e) => ({
            id: e.employeeId,
            name: e.employeeName,
            gross: fmt(e.grossWage),
            urlaub: fmt(e.urlaubBeitrag),
            berufsbildung: fmt(e.berufsbildungBeitrag),
            rente: fmt(e.renteBeitrag),
            total: fmt(e.totalBeitrag),
          })),
          totals: {
            gross: fmt(grossTotal),
            urlaub: fmt(soka?.totals.urlaub ?? 0),
            berufsbildung: fmt(soka?.totals.berufsbildung ?? 0),
            rente: fmt(soka?.totals.rente ?? 0),
            total: fmt(soka?.totals.total ?? 0),
          },
        }}
      />
    </div>
  )
}
