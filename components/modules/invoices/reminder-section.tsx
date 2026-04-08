"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/shared/currency-input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { addReminder } from "@/lib/actions/invoices"
import type { InvoiceReminder } from "@/lib/actions/invoices"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Bell, Plus, Loader2, AlertTriangle } from "lucide-react"

const REMINDER_FEES: Record<number, number> = { 1: 0, 2: 5, 3: 25 }

interface ReminderSectionProps {
  invoiceId: string
  invoiceStatus: string
  reminders: InvoiceReminder[]
  dueAmount: number
}

const REMINDER_LABELS: Record<
  number,
  { label: string; variant: "warning" | "danger" | "neutral" }
> = {
  1: { label: "1. Mahnung", variant: "warning" },
  2: { label: "2. Mahnung", variant: "danger" },
  3: { label: "Letzte Mahnung", variant: "danger" },
}

export function ReminderSection({
  invoiceId,
  invoiceStatus,
  reminders: initialReminders,
  dueAmount,
}: ReminderSectionProps) {
  const [reminders, setReminders] = useState(initialReminders)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const nextLevel = Math.min(reminders.length + 1, 3) as 1 | 2 | 3
  const canCreateReminder =
    invoiceStatus !== "paid" && reminders.length < 3

  const today = new Date().toISOString().split("T")[0]
  const defaultFee = REMINDER_FEES[nextLevel] ?? 0

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("reminder_level", String(nextLevel))
    formData.set("due_amount", String(dueAmount))

    startTransition(async () => {
      const result = await addReminder(invoiceId, formData)
      if (result.error) {
        const msg =
          typeof result.error === "string"
            ? result.error
            : "Fehler beim Erstellen der Mahnung"
        toast.error(msg)
        return
      }
      if (result.data) {
        setReminders((prev) => [...prev, result.data!])
      }
      toast.success(
        `${REMINDER_LABELS[nextLevel]?.label ?? "Mahnung"} wurde erstellt`
      )
      setIsAddOpen(false)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {reminders.length} von 3 Mahnungen versendet
          </p>
        </div>
        {canCreateReminder && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="rounded-xl font-semibold h-9 gap-2 text-sm"
            aria-label={`${REMINDER_LABELS[nextLevel]?.label ?? "Mahnung"} erstellen`}
          >
            <Plus className="h-3.5 w-3.5" />
            {REMINDER_LABELS[nextLevel]?.label ?? "Mahnung"} erstellen
          </Button>
        )}
      </div>

      {/* Warning if overdue */}
      {invoiceStatus === "overdue" && reminders.length === 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <p className="text-sm font-medium text-danger">
            Diese Rechnung ist überfällig. Erstellen Sie jetzt die erste
            Mahnung.
          </p>
        </div>
      )}

      {reminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Keine Mahnungen vorhanden"
          description="Sobald eine Rechnung überfällig ist, können Sie hier Mahnungen mit automatischer Gebührenberechnung erstellen."
          action={
            canCreateReminder
              ? {
                  label: "Erste Mahnung erstellen",
                  onClick: () => setIsAddOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const cfg = REMINDER_LABELS[reminder.reminder_level]
            return (
              <Card key={reminder.id} className="rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {cfg?.label ??
                            `Mahnung ${reminder.reminder_level}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Versendet am {formatDate(reminder.sent_date)}
                        </p>
                        {reminder.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {reminder.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge
                        label={
                          cfg?.label ??
                          `Stufe ${reminder.reminder_level}`
                        }
                        variant={cfg?.variant ?? "neutral"}
                      />
                      {reminder.fee != null && reminder.fee > 0 && (
                        <p className="text-xs font-mono font-semibold text-danger mt-1">
                          + {formatCurrency(reminder.fee)} Mahngebühr
                        </p>
                      )}
                      {(reminder.fee === null || reminder.fee === 0) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Keine Gebühr
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paid indicator */}
      {invoiceStatus === "paid" && (
        <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
          <div className="h-2 w-2 rounded-full bg-success" />
          <p className="text-sm font-medium text-success">
            Rechnung wurde bezahlt — keine weiteren Mahnungen notwendig.
          </p>
        </div>
      )}

      {/* Max reminders reached */}
      {reminders.length >= 3 && invoiceStatus !== "paid" && (
        <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <p className="text-sm font-medium text-danger">
            Alle 3 Mahnstufen wurden versendet. Bitte übergeben Sie den Fall
            an ein Inkassobüro oder einen Rechtsanwalt.
          </p>
        </div>
      )}

      {/* Create reminder dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              {REMINDER_LABELS[nextLevel]?.label ?? "Mahnung"} erstellen
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="rounded-xl bg-muted border p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Mahnstufe
              </p>
              <p className="text-sm font-semibold text-foreground">
                {REMINDER_LABELS[nextLevel]?.label ??
                  `Mahnung ${nextLevel}`}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reminder-date">Versanddatum *</Label>
              <Input
                id="reminder-date"
                name="sent_date"
                type="date"
                defaultValue={today}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reminder-fee">Mahngebühr (EUR)</Label>
              <CurrencyInput
                name="fee"
                defaultValue={defaultFee}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground">
                Empfehlung: {formatCurrency(defaultFee)} für Mahnstufe{" "}
                {nextLevel}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reminder-notes">Notizen</Label>
              <Textarea
                id="reminder-notes"
                name="notes"
                placeholder="Zusätzliche Hinweise zur Mahnung..."
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setIsAddOpen(false)}
                aria-label="Abbrechen"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl font-semibold"
                aria-label="Mahnung erstellen"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Mahnung erstellen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
