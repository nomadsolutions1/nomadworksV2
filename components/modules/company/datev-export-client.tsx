"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { exportDatevTimeEntries } from "@/lib/actions/soka"
import { exportInvoicesDatev } from "@/lib/actions/invoices"

function firstOfMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function DatevExportClient() {
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(today())
  const [timeLoading, setTimeLoading] = useState(false)
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  async function handleTimeExport() {
    setTimeLoading(true)
    try {
      const result = await exportDatevTimeEntries(from, to)
      if (result.error || !result.data) {
        toast.error(
          result.error ||
            "Export fehlgeschlagen. Bitte prüfen Sie den Zeitraum und versuchen Sie es erneut."
        )
        return
      }
      triggerDownload(result.data, `DATEV_Zeiten_${from}_bis_${to}.csv`)
      toast.success("Zeiten-Export wurde heruntergeladen.")
    } finally {
      setTimeLoading(false)
    }
  }

  async function handleInvoiceExport() {
    setInvoiceLoading(true)
    try {
      const result = await exportInvoicesDatev(from, to)
      if (result.error || !result.data) {
        toast.error(
          result.error ||
            "Export fehlgeschlagen. Bitte prüfen Sie den Zeitraum und versuchen Sie es erneut."
        )
        return
      }
      triggerDownload(result.data, `DATEV_Rechnungen_${from}_bis_${to}.csv`)
      toast.success("Rechnungs-Export wurde heruntergeladen.")
    } finally {
      setInvoiceLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="datev-from">Von</Label>
          <Input
            id="datev-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.currentTarget.value)}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="datev-to">Bis</Label>
          <Input
            id="datev-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.currentTarget.value)}
            className="h-11 rounded-xl"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          onClick={handleInvoiceExport}
          disabled={invoiceLoading}
          className="rounded-xl font-semibold"
        >
          {invoiceLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Rechnungen (DATEV-CSV)
        </Button>
        <Button
          onClick={handleTimeExport}
          disabled={timeLoading}
          variant="outline"
          className="rounded-xl font-semibold"
        >
          {timeLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Zeiten (DATEV-CSV)
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Die CSV-Dateien enthalten Semikolon als Trennzeichen und Komma als Dezimaltrennzeichen —
        so wie DATEV es erwartet. Zeilenende ist CRLF, Encoding UTF-8 mit BOM.
      </p>
    </div>
  )
}
