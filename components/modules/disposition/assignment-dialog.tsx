"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Trash2, Loader2, Moon, Sun, Clock, Coffee } from "lucide-react"
import { createAssignment, updateAssignment, deleteAssignment, bulkCreateAssignments } from "@/lib/actions/disposition"
import { getWeekDateStrings } from "@/lib/utils/dates"
import type { Assignment } from "@/lib/actions/disposition"

interface Employee { id: string; first_name: string; last_name: string }
interface Site { id: string; name: string; status: string }
interface Props {
  open: boolean; onClose: () => void; prefilledDate?: string; prefilledUserId?: string
  existingAssignment?: Assignment; employees: Employee[]; sites: Site[]; weekStart?: string
  startInBulkMode?: boolean
}

const SHIFTS = [
  { key: "frueh", label: "Früh", icon: Sun, start: "06:00", end: "14:30", br: 30 },
  { key: "spaet", label: "Spät", icon: Clock, start: "14:00", end: "22:00", br: 30 },
  { key: "nacht", label: "Nacht", icon: Moon, start: "22:00", end: "06:00", br: 30 },
  { key: "ganztag", label: "Ganztag", icon: Coffee, start: "07:00", end: "17:00", br: 60 },
] as const
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

export function AssignmentDialog({
  open, onClose, prefilledDate, prefilledUserId,
  existingAssignment, employees, sites, weekStart, startInBulkMode,
}: Props) {
  const router = useRouter()
  const isEdit = !!existingAssignment
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const [userId, setUserId] = useState(existingAssignment?.user_id ?? prefilledUserId ?? "")
  const [siteId, setSiteId] = useState(existingAssignment?.site_id ?? "")
  const [shiftType, setShiftType] = useState("ganztag")
  const [startTime, setStartTime] = useState(existingAssignment?.start_time ?? "07:00")
  const [endTime, setEndTime] = useState(existingAssignment?.end_time ?? "17:00")
  const [breakMinutes, setBreakMinutes] = useState(String(existingAssignment?.break_minutes ?? 60))
  const [notes, setNotes] = useState(existingAssignment?.notes ?? "")
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [bulkMode, setBulkMode] = useState(startInBulkMode ?? false)

  function applyPreset(p: typeof SHIFTS[number]) {
    setShiftType(p.key); setStartTime(p.start); setEndTime(p.end); setBreakMinutes(String(p.br))
  }

  function toggleDay(idx: number) {
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort()
    )
  }

  function handleSubmit() {
    if (!userId || !siteId) {
      toast.error("Bitte alle Pflichtfelder ausfuellen")
      return
    }

    startTransition(async () => {
      if (bulkMode && weekStart) {
        const weekDates = getWeekDateStrings(weekStart)
        const days = selectedDays.map((i) => weekDates[i])
        const result = await bulkCreateAssignments({
          employee_id: userId,
          site_id: siteId,
          days,
          start_time: startTime,
          end_time: endTime,
          break_minutes: Number(breakMinutes),
          shift_type: shiftType,
          notes: notes || undefined,
        })

        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : "Fehler beim Speichern"
          toast.error(msg)
        } else {
          toast.success(`${result.created} Zuweisungen erstellt`)
          if (result.warnings) result.warnings.forEach((w) => toast.warning(w))
          router.refresh()
          onClose()
        }
      } else {
        const formData = new FormData()
        formData.set("employee_id", userId)
        formData.set("site_id", siteId)
        formData.set("date", existingAssignment?.date ?? prefilledDate ?? "")
        formData.set("shift_type", shiftType)
        formData.set("start_time", startTime)
        formData.set("end_time", endTime)
        formData.set("break_minutes", breakMinutes)
        if (notes) formData.set("notes", notes)

        const result = isEdit
          ? await updateAssignment(existingAssignment!.id, formData)
          : await createAssignment(formData)

        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : "Fehler beim Speichern"
          toast.error(msg)
        } else {
          toast.success(isEdit ? "Zuweisung aktualisiert" : "Zuweisung erstellt")
          if ("warning" in result && result.warning) toast.warning(result.warning as string)
          router.refresh()
          onClose()
        }
      }
    })
  }

  function handleDelete() {
    if (!existingAssignment) return
    startDeleteTransition(async () => {
      const result = await deleteAssignment(existingAssignment.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Zuweisung gelöscht")
        router.refresh()
        onClose()
      }
    })
  }

  const activeSites = sites.filter((s) => s.status === "active")

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Zuweisung bearbeiten" : "Mitarbeiter einplanen"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Employee */}
          <div className="space-y-1.5">
            <Label>Mitarbeiter</Label>
            <Select value={userId} onValueChange={(v) => setUserId(v ?? "")} disabled={!!prefilledUserId || isEdit}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Mitarbeiter wählen..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Site */}
          <div className="space-y-1.5">
            <Label>Baustelle</Label>
            <Select value={siteId} onValueChange={(v) => setSiteId(v ?? "")}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Baustelle wählen..." />
              </SelectTrigger>
              <SelectContent>
                {activeSites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift presets */}
          <div className="space-y-2">
            <Label>Schicht-Vorlage</Label>
            <div className="flex gap-2 flex-wrap">
              {SHIFTS.map((preset) => (
                <Button
                  key={preset.key}
                  type="button"
                  variant={shiftType === preset.key ? "default" : "outline"}
                  size="sm"
                  className="rounded-lg text-xs gap-1.5"
                  onClick={() => applyPreset(preset)}
                >
                  <preset.icon className="h-3.5 w-3.5" />
                  {preset.label}
                </Button>
              ))}
              <Button
                type="button"
                variant={shiftType === "custom" ? "default" : "outline"}
                size="sm"
                className="rounded-lg text-xs"
                onClick={() => setShiftType("custom")}
              >
                Custom
              </Button>
            </div>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Von</Label>
              <Input type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); setShiftType("custom") }} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bis</Label>
              <Input type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); setShiftType("custom") }} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pause (Min)</Label>
              <Input type="number" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>

          {/* Bulk mode: day selection */}
          {!isEdit && weekStart && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bulk-mode"
                  checked={bulkMode}
                  onChange={(e) => setBulkMode(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="bulk-mode" className="text-sm cursor-pointer">
                  Mehrere Tage auf einmal
                </Label>
              </div>
              {bulkMode && (
                <div className="flex gap-1.5">
                  {DAYS.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      aria-label={`Tag auswählen: ${label}`}
                      aria-pressed={selectedDays.includes(idx)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        selectedDays.includes(idx)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notizen (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Besondere Hinweise..."
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isEdit && (
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl mr-auto"
              onClick={handleDelete}
              disabled={isDeleting || isPending}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Löschen
            </Button>
          )}
          <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={isPending || isDeleting}>
            Abbrechen
          </Button>
          <Button className="rounded-xl font-semibold" onClick={handleSubmit} disabled={isPending || isDeleting}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEdit ? "Speichern" : bulkMode ? `${selectedDays.length} Tage planen` : "Einplanen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
