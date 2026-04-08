"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { createLeaveRequest, updateLeaveRequestStatus, addSickDay } from "@/lib/actions/employees"
import { formatDate } from "@/lib/utils/format"
import { LEAVE_STATUS_CONFIG, LEAVE_TYPES } from "@/lib/utils/constants"
import { CalendarDays, Stethoscope, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react"
import type { LeaveRequest, SickDay } from "@/lib/actions/employees"

interface LeaveSectionProps {
  userId: string
  leaveRequests: LeaveRequest[]
  sickDays: SickDay[]
}

export function LeaveSection({ userId, leaveRequests: initial, sickDays: initialSick }: LeaveSectionProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initial)
  const [sickDays] = useState<SickDay[]>(initialSick)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [sickOpen, setSickOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [leaveType, setLeaveType] = useState("")
  const [hasCertificate, setHasCertificate] = useState(false)
  const handleLeaveTypeChange = (v: string | null) => setLeaveType(v ?? "")

  function handleAddLeave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("type", leaveType)
    startTransition(async () => {
      const result = await createLeaveRequest(userId, formData)
      if (result.error) {
        const msg = typeof result.error === "string" ? result.error : Object.values(result.error).flat().join(", ")
        toast.error(msg)
      } else {
        toast.success("Urlaubsantrag eingetragen")
        setLeaveOpen(false)
        setLeaveType("")
      }
    })
  }

  function handleAddSick(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("has_certificate", hasCertificate ? "true" : "false")
    startTransition(async () => {
      const result = await addSickDay(userId, formData)
      if (result.error) {
        const msg = typeof result.error === "string" ? result.error : Object.values(result.error).flat().join(", ")
        toast.error(msg)
      } else {
        toast.success("Krankmeldung eingetragen")
        setSickOpen(false)
        setHasCertificate(false)
      }
    })
  }

  function handleUpdateStatus(requestId: string, status: "approved" | "rejected") {
    startTransition(async () => {
      const result = await updateLeaveRequestStatus(requestId, userId, status)
      if (result.error) { toast.error(result.error) } else {
        setLeaveRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)))
        toast.success(status === "approved" ? "Genehmigt" : "Abgelehnt")
      }
    })
  }

  const approvedLeaveDays = leaveRequests.filter((r) => r.status === "approved").reduce((sum, r) => sum + r.days, 0)
  const totalSickDays = sickDays.reduce((sum, s) => sum + s.days, 0)

  return (
    <Tabs defaultValue="leave">
      <TabsList className="mb-4">
        <TabsTrigger value="leave" className="rounded-lg">Urlaub ({approvedLeaveDays} Tage)</TabsTrigger>
        <TabsTrigger value="sick" className="rounded-lg">Krankheit ({totalSickDays} Tage)</TabsTrigger>
      </TabsList>

      <TabsContent value="leave" className="space-y-4 mt-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{leaveRequests.length} Einträge · {approvedLeaveDays} genehmigte Tage</p>
          <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
            <DialogTrigger render={<Button size="sm" className="rounded-xl font-semibold" />}>
              <Plus className="h-4 w-4 mr-1.5" /> Urlaub eintragen
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Urlaub eintragen</DialogTitle></DialogHeader>
              <form onSubmit={handleAddLeave} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Art des Urlaubs *</Label>
                  <Select value={leaveType} onValueChange={handleLeaveTypeChange} required>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Typ auswählen" /></SelectTrigger>
                    <SelectContent>{LEAVE_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label htmlFor="leave_start">Von *</Label><Input id="leave_start" name="start_date" type="date" className="h-11 rounded-xl" required /></div>
                  <div className="space-y-1.5"><Label htmlFor="leave_end">Bis *</Label><Input id="leave_end" name="end_date" type="date" className="h-11 rounded-xl" required /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="leave_days">Arbeitstage *</Label><Input id="leave_days" name="days" type="number" min={1} max={365} placeholder="5" className="h-11 rounded-xl" required /></div>
                <div className="space-y-1.5"><Label htmlFor="leave_notes">Notizen</Label><Textarea id="leave_notes" name="notes" placeholder="Weitere Informationen..." className="rounded-xl resize-none" rows={2} /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => setLeaveOpen(false)}>Abbrechen</Button>
                  <Button type="submit" className="rounded-xl font-semibold" disabled={isPending || !leaveType}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Speichern
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {leaveRequests.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Keine Urlaubsanträge" description="Noch keine Urlaubsanträge für diesen Mitarbeiter vorhanden." />
        ) : (
          <div className="space-y-2">
            {leaveRequests.map((req) => {
              const cfg = LEAVE_STATUS_CONFIG[req.status] ?? { label: req.status, variant: "neutral" as const }
              return (
                <div key={req.id} className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2"><CalendarDays className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{LEAVE_TYPES.find((t) => t.value === req.type)?.label ?? req.type}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(req.start_date)} – {formatDate(req.end_date)} · {req.days} {req.days === 1 ? "Tag" : "Tage"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={cfg.label} variant={cfg.variant} />
                    {req.status === "pending" && (
                      <>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-success hover:bg-success/10 rounded-lg" onClick={() => handleUpdateStatus(req.id, "approved")} disabled={isPending} title="Genehmigen"><CheckCircle2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-danger hover:bg-danger/10 rounded-lg" onClick={() => handleUpdateStatus(req.id, "rejected")} disabled={isPending} title="Ablehnen"><XCircle className="h-4 w-4" /></Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="sick" className="space-y-4 mt-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{sickDays.length} Meldungen · {totalSickDays} Tage gesamt</p>
          <Dialog open={sickOpen} onOpenChange={setSickOpen}>
            <DialogTrigger render={<Button size="sm" className="rounded-xl font-semibold" />}>
              <Plus className="h-4 w-4 mr-1.5" /> Krankmeldung eintragen
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Krankmeldung eintragen</DialogTitle></DialogHeader>
              <form onSubmit={handleAddSick} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label htmlFor="sick_start">Von *</Label><Input id="sick_start" name="start_date" type="date" className="h-11 rounded-xl" required /></div>
                  <div className="space-y-1.5"><Label htmlFor="sick_end">Bis *</Label><Input id="sick_end" name="end_date" type="date" className="h-11 rounded-xl" required /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="sick_days">Krankheitstage *</Label><Input id="sick_days" name="days" type="number" min={1} max={365} placeholder="3" className="h-11 rounded-xl" required /></div>
                <div className="flex items-center gap-3">
                  <Checkbox id="has_certificate" checked={hasCertificate} onCheckedChange={(c) => setHasCertificate(c === true)} />
                  <Label htmlFor="has_certificate" className="cursor-pointer font-normal">Arbeitsunfähigkeitsbescheinigung liegt vor</Label>
                </div>
                <div className="space-y-1.5"><Label htmlFor="sick_notes">Notizen</Label><Textarea id="sick_notes" name="notes" placeholder="Weitere Informationen..." className="rounded-xl resize-none" rows={2} /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => setSickOpen(false)}>Abbrechen</Button>
                  <Button type="submit" className="rounded-xl font-semibold" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Speichern
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {sickDays.length === 0 ? (
          <EmptyState icon={Stethoscope} title="Keine Krankmeldungen" description="Noch keine Krankmeldungen für diesen Mitarbeiter vorhanden." />
        ) : (
          <div className="space-y-2">
            {sickDays.map((sick) => (
              <div key={sick.id} className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-danger/10 p-2"><Stethoscope className="h-4 w-4 text-danger" /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Krankmeldung · {sick.days} {sick.days === 1 ? "Tag" : "Tage"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(sick.start_date)} – {formatDate(sick.end_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sick.has_certificate ? <StatusBadge label="AU-Schein" variant="success" /> : <StatusBadge label="Kein AU-Schein" variant="neutral" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
