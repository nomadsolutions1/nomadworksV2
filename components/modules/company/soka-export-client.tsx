"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Printer, Loader2, FileText } from "lucide-react"
import { exportSokaCSV } from "@/lib/actions/soka"

type DisplayEmployee = {
  id: string
  name: string
  gross: string
  urlaub: string
  berufsbildung: string
  rente: string
  total: string
}

type DisplayTotals = {
  gross: string
  urlaub: string
  berufsbildung: string
  rente: string
  total: string
}

interface Props {
  selectedMonth: string
  monthLabel: string
  hasError: boolean
  errorMessage?: string
  employees: Array<{ employeeId: string; employeeName: string }>
  totals: { urlaub: number; berufsbildung: number; rente: number; total: number }
  rates: { urlaub: number; berufsbildung: number; rente: number }
  grossTotal: number
  fmtCurrencyNumbers: {
    employees: DisplayEmployee[]
    totals: DisplayTotals
  }
}

export function SokaExportClient({
  selectedMonth,
  monthLabel,
  hasError,
  errorMessage,
  employees,
  rates,
  fmtCurrencyNumbers,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [downloading, setDownloading] = useState(false)

  function handleMonthChange(value: string) {
    if (!value) return
    startTransition(() => {
      router.push(`/firma/soka-export?month=${value}`)
    })
  }

  async function handleCsvDownload() {
    setDownloading(true)
    try {
      const result = await exportSokaCSV(selectedMonth)
      if (result.error || !result.data) {
        toast.error(
          result.error ||
            "CSV konnte nicht erzeugt werden. Bitte Monat prüfen oder erneut versuchen."
        )
        return
      }
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `SOKA-Bau_${selectedMonth}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("CSV wurde heruntergeladen.")
    } finally {
      setDownloading(false)
    }
  }

  const isEmpty = !hasError && employees.length === 0

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monat auswählen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <Label htmlFor="soka-month">Abrechnungsmonat</Label>
            <Input
              id="soka-month"
              type="month"
              defaultValue={selectedMonth}
              onChange={(e) => handleMonthChange(e.currentTarget.value)}
              className="h-11 rounded-xl max-w-[220px]"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">Aktuell gewählt: {monthLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleCsvDownload}
              disabled={downloading || isEmpty || hasError}
              className="rounded-xl font-semibold"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              CSV herunterladen
            </Button>
            <Link
              href={`/firma/soka-export/drucken?month=${selectedMonth}`}
              target="_blank"
              className="inline-flex h-10 items-center rounded-xl border border-input bg-background px-4 text-sm font-semibold hover:bg-accent"
            >
              <Printer className="h-4 w-4 mr-2" />
              Drucken / PDF
            </Link>
          </div>
        </CardContent>
      </Card>

      {hasError && (
        <Card className="rounded-2xl border-danger/40 bg-danger/5">
          <CardContent className="p-4 text-sm text-danger">
            Die SOKA-Berechnung konnte nicht geladen werden.
            {errorMessage ? ` (${errorMessage})` : ""} Bitte prüfen Sie die SOKA-Einstellungen
            unter Firma und versuchen Sie es erneut.
          </CardContent>
        </Card>
      )}

      {isEmpty && (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8 text-center space-y-3">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-foreground">Keine Löhne in diesem Monat</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Für {monthLabel} wurden keine Bruttolöhne gefunden. Prüfen Sie, ob
              Zeiteinträge erfasst wurden und Mitarbeiter einen Stundensatz oder ein
              Monatsgehalt hinterlegt haben.
            </p>
          </CardContent>
        </Card>
      )}

      {!hasError && employees.length > 0 && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Vorschau – {monthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4 font-semibold">Mitarbeiter</th>
                  <th className="py-2 pr-4 font-semibold text-right">Bruttolohn</th>
                  <th className="py-2 pr-4 font-semibold text-right">
                    Urlaub ({rates.urlaub}%)
                  </th>
                  <th className="py-2 pr-4 font-semibold text-right">
                    Berufsbildung ({rates.berufsbildung}%)
                  </th>
                  <th className="py-2 pr-4 font-semibold text-right">
                    Rente ({rates.rente}%)
                  </th>
                  <th className="py-2 pr-0 font-semibold text-right">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {fmtCurrencyNumbers.employees.map((e) => (
                  <tr key={e.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">{e.name}</td>
                    <td className="py-2 pr-4 text-right font-mono">{e.gross}</td>
                    <td className="py-2 pr-4 text-right font-mono">{e.urlaub}</td>
                    <td className="py-2 pr-4 text-right font-mono">{e.berufsbildung}</td>
                    <td className="py-2 pr-4 text-right font-mono">{e.rente}</td>
                    <td className="py-2 pr-0 text-right font-mono font-semibold">
                      {e.total}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <td className="py-2 pr-4">SUMME</td>
                  <td className="py-2 pr-4 text-right font-mono">
                    {fmtCurrencyNumbers.totals.gross}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">
                    {fmtCurrencyNumbers.totals.urlaub}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">
                    {fmtCurrencyNumbers.totals.berufsbildung}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono">
                    {fmtCurrencyNumbers.totals.rente}
                  </td>
                  <td className="py-2 pr-0 text-right font-mono text-primary">
                    {fmtCurrencyNumbers.totals.total}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
