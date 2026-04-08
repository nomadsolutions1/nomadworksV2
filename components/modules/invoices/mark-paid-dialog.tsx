"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { markAsPaid } from "@/lib/actions/invoices"
import { CheckCircle2, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"

interface MarkPaidDialogProps {
  invoiceId: string
  total: number
  onPaid?: () => void
}

export function MarkPaidDialog({
  invoiceId,
  total,
  onPaid,
}: MarkPaidDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().split("T")[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await markAsPaid(invoiceId, formData)
      if (result.error) {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Fehler beim Speichern"
        )
        return
      }
      toast.success("Rechnung als bezahlt markiert")
      setIsOpen(false)
      onPaid?.()
    })
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-success hover:bg-success/90 font-semibold h-9 gap-2 text-sm text-white"
        aria-label="Rechnung als bezahlt markieren"
      >
        <CheckCircle2 className="h-4 w-4" />
        Als bezahlt markieren
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Zahlung erfassen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="paid-date">Zahlungsdatum *</Label>
              <Input
                id="paid-date"
                name="paid_date"
                type="date"
                defaultValue={today}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment-method">Zahlungsart</Label>
              <Input
                id="payment-method"
                name="payment_method"
                placeholder="z.B. Überweisung, Bar"
                className="h-11 rounded-xl"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Rechnungsbetrag: {formatCurrency(total)}
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setIsOpen(false)}
                aria-label="Abbrechen"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-success hover:bg-success/90 font-semibold text-white"
                aria-label="Zahlung speichern"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Zahlung speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
