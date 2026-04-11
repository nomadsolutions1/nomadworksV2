import { getSokaCalculations } from "@/lib/actions/soka"
import { requireCompanyAuth } from "@/lib/utils/auth-helper"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { PrintButton } from "@/components/modules/company/soka-print-button"

type AnyRow = Record<string, unknown>

export const metadata: Metadata = { title: "SOKA-Bau Meldung — Druck" }

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
]

export default async function SokaPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const selectedMonth =
    month ||
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`

  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) redirect("/login")

  const [{ data: company }, { data: sokaData, error }] = await Promise.all([
    db.from("companies").select("name, address").eq("id", profile.company_id).single(),
    getSokaCalculations(selectedMonth),
  ])

  if (error || !sokaData) redirect("/firma/soka-export")

  const c = (company as AnyRow) || {}
  const [year, monthNum] = selectedMonth.split("-").map(Number)
  const monthLabel = `${MONTHS[monthNum - 1]} ${year}`
  const fmt = (n: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n)

  const grossTotal = sokaData.employees.reduce((s, e) => s + e.grossWage, 0)

  return (
    <div className="print-page bg-white p-8 max-w-[210mm] mx-auto text-[11px] text-foreground leading-relaxed">
      <style>{`
        @media print {
          body { margin: 0; -webkit-print-color-adjust: exact; }
          @page { size: A4; margin: 15mm; }
          .no-print { display: none !important; }
        }
        .print-page table { border-collapse: collapse; width: 100%; }
        .print-page th, .print-page td { border: 1px solid #374151; padding: 4px 8px; text-align: left; }
        .print-page th { background: #f1f5f9; font-weight: 600; }
        .print-page td.num { text-align: right; font-variant-numeric: tabular-nums; }
      `}</style>

      <div className="flex justify-between items-start mb-6 border-b pb-4">
        <div>
          <h1 className="text-lg font-bold">{(c.name as string) || "Firma"}</h1>
          <p className="text-[10px] text-muted-foreground">{(c.address as string) || ""}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm">SOKA-Bau Meldung</p>
          <p className="text-muted-foreground">{monthLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-[11px]">
        {sokaData.betriebskontoNr && (
          <div>
            <span className="font-semibold">Betriebskonto-Nr:</span> {sokaData.betriebskontoNr}
          </div>
        )}
        {sokaData.branchenkennziffer && (
          <div>
            <span className="font-semibold">Branchenkennziffer:</span> {sokaData.branchenkennziffer}
          </div>
        )}
      </div>

      <table className="mb-8">
        <thead>
          <tr>
            <th>Mitarbeiter</th>
            <th className="text-right">Bruttolohn</th>
            <th className="text-right">Urlaub ({sokaData.rates.urlaub}%)</th>
            <th className="text-right">Berufsbildung ({sokaData.rates.berufsbildung}%)</th>
            <th className="text-right">Rente ({sokaData.rates.rente}%)</th>
            <th className="text-right">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          {sokaData.employees.map((e) => (
            <tr key={e.employeeId}>
              <td>{e.employeeName}</td>
              <td className="num">{fmt(e.grossWage)}</td>
              <td className="num">{fmt(e.urlaubBeitrag)}</td>
              <td className="num">{fmt(e.berufsbildungBeitrag)}</td>
              <td className="num">{fmt(e.renteBeitrag)}</td>
              <td className="num">{fmt(e.totalBeitrag)}</td>
            </tr>
          ))}
          <tr className="font-bold" style={{ background: "#f1f5f9" }}>
            <td>SUMME</td>
            <td className="num">{fmt(grossTotal)}</td>
            <td className="num">{fmt(sokaData.totals.urlaub)}</td>
            <td className="num">{fmt(sokaData.totals.berufsbildung)}</td>
            <td className="num">{fmt(sokaData.totals.rente)}</td>
            <td className="num">{fmt(sokaData.totals.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-12 pt-6 border-t flex justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground/70 mb-8">Datum</p>
          <div className="border-b border-foreground/80 w-48" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground/70 mb-8">Unterschrift Geschäftsführer</p>
          <div className="border-b border-foreground/80 w-48" />
        </div>
      </div>

      <div className="no-print mt-8 text-center">
        <PrintButton />
      </div>
    </div>
  )
}
