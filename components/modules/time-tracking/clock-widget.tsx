"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Clock, MapPin, LogIn, LogOut, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { clockIn, clockOut } from "@/lib/actions/time-entries"
import type { OpenTimeEntry } from "@/lib/actions/time-entries"

interface ClockWidgetProps {
  openEntry: OpenTimeEntry | null
  sites: { id: string; name: string }[]
  assignedSiteId?: string
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

async function getGPS(): Promise<{ lat: string; lng: string } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }),
      () => resolve(null),
      { timeout: 5000 }
    )
  })
}

export function ClockWidget({ openEntry: initialOpenEntry, sites, assignedSiteId }: ClockWidgetProps) {
  const router = useRouter()
  const [openEntry, setOpenEntry] = useState<OpenTimeEntry | null>(initialOpenEntry)
  const [selectedSite, setSelectedSite] = useState(assignedSiteId ?? "")
  const [notes, setNotes] = useState("")
  const [breakMinutes, setBreakMinutes] = useState("0")
  const [elapsed, setElapsed] = useState(0)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!openEntry) return
    const clockInTime = new Date(openEntry.clock_in).getTime()
    const tick = () => setElapsed(Date.now() - clockInTime)
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [openEntry])

  function handleClockIn() {
    if (!selectedSite) {
      toast.error("Bitte eine Baustelle auswählen")
      return
    }
    startTransition(async () => {
      const gps = await getGPS()
      const fd = new FormData()
      fd.append("site_id", selectedSite)
      if (gps) { fd.append("lat", gps.lat); fd.append("lng", gps.lng) }
      if (notes) fd.append("notes", notes)

      const result = await clockIn(fd)
      if (result.error) {
        const msg = typeof result.error === "string" ? result.error : "Fehler beim Einstempeln"
        toast.error(msg)
      } else {
        const site = sites.find((s) => s.id === selectedSite)
        setOpenEntry({
          id: result.id!,
          site_id: selectedSite,
          site_name: site?.name ?? "Baustelle",
          clock_in: new Date().toISOString(),
          notes: notes || null,
        })
        setNotes("")
        toast.success("Eingestempelt!")
        router.refresh()
      }
    })
  }

  function handleClockOut() {
    startTransition(async () => {
      const gps = await getGPS()
      const fd = new FormData()
      if (gps) { fd.append("lat", gps.lat); fd.append("lng", gps.lng) }
      fd.append("break_minutes", breakMinutes)
      if (notes) fd.append("notes", notes)

      const result = await clockOut(fd)
      if (result.error) {
        const msg = typeof result.error === "string" ? result.error : "Fehler beim Ausstempeln"
        toast.error(msg)
      } else {
        setOpenEntry(null)
        setNotes("")
        setBreakMinutes("0")
        toast.success("Ausgestempelt!")
        router.refresh()
      }
    })
  }

  if (openEntry) {
    return (
      <Card className="rounded-2xl shadow-sm border-success/30 bg-gradient-to-br from-success/5 to-success/10">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-success" />
            </span>
            <span className="text-sm font-semibold text-success">Eingestempelt</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <MapPin className="h-4 w-4 text-success shrink-0" />
            <span className="font-medium">{openEntry.site_name}</span>
          </div>
          <div className="text-center py-4">
            <div className="text-5xl font-mono font-semibold text-foreground tabular-nums tracking-tight min-h-[60px] min-w-[200px]">
              {formatElapsed(elapsed)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              seit {new Date(openEntry.clock_in).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Pause (Minuten)</Label>
            <Select value={breakMinutes} onValueChange={(v) => setBreakMinutes(v ?? "0")}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["0", "15", "30", "45", "60", "90"].map((v) => (
                  <SelectItem key={v} value={v}>{v === "0" ? "Keine Pause" : `${v} Minuten`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleClockOut}
            disabled={isPending}
            aria-label="Ausstempeln"
            className="w-[200px] min-h-[200px] rounded-full bg-destructive hover:bg-destructive/90 font-semibold text-white text-2xl mx-auto flex flex-col items-center justify-center gap-3"
          >
            {isPending ? <Loader2 className="h-10 w-10 animate-spin" /> : <LogOut className="h-10 w-10" />}
            AUSSTEMPELN
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
            <MapPin className="h-3.5 w-3.5" />
            GPS-Standort wird beim Ausstempeln erfasst
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-muted-foreground" />
          </span>
          <span className="text-sm font-semibold text-muted-foreground">Nicht eingestempelt</span>
        </div>
        <div className="text-center py-4">
          <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-sm text-muted-foreground">Wählen Sie eine Baustelle und stempeln Sie ein</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Baustelle *</Label>
          {sites.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3">
              <AlertCircle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-sm text-warning">Keine aktiven Baustellen verfügbar</p>
            </div>
          ) : (
            <Select value={selectedSite} onValueChange={(v) => setSelectedSite(v ?? "")}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Baustelle auswählen..." /></SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Notizen (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="z.B. Tagesaufgaben..."
            className="rounded-xl resize-none text-sm"
            rows={2}
          />
        </div>
        <Button
          onClick={handleClockIn}
          disabled={isPending || !selectedSite || sites.length === 0}
          aria-label="Einstempeln"
          className="w-[200px] min-h-[200px] rounded-full bg-success hover:bg-success/90 font-semibold text-white text-2xl mx-auto flex flex-col items-center justify-center gap-3"
        >
          {isPending ? <Loader2 className="h-10 w-10 animate-spin" /> : <LogIn className="h-10 w-10" />}
          EINSTEMPELN
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
          <MapPin className="h-3.5 w-3.5" />
          GPS-Standort wird optional erfasst
        </p>
      </CardContent>
    </Card>
  )
}
