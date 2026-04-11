"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { createAssignment } from "@/lib/actions/subcontractors"

interface OrderOption {
  id: string
  title: string
}

interface AssignmentDialogProps {
  subcontractorId: string
  orders: OrderOption[]
}

export function SubcontractorAssignmentDialog({
  subcontractorId,
  orders,
}: AssignmentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [orderId, setOrderId] = useState("")
  const [status, setStatus] = useState("active")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    formData.set("order_id", orderId)
    formData.set("status", status)

    startTransition(async () => {
      const result = await createAssignment(subcontractorId, formData)
      if (result?.error) {
        if (typeof result.error === "string") {
          toast.error(result.error)
        } else {
          setFieldErrors(result.error)
          toast.error("Bitte prüfen Sie Ihre Eingaben")
        }
        return
      }
      toast.success("Einsatz angelegt")
      setOpen(false)
      setOrderId("")
      setStatus("active")
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="rounded-xl font-semibold gap-2" />}>
        <Plus className="h-4 w-4" />
        Einsatz anlegen
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Einsatz anlegen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Auftrag *</Label>
            <Select value={orderId} onValueChange={(v) => setOrderId(v ?? "")}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Auftrag wählen">
                  {(value) =>
                    orders.find((o) => o.id === value)?.title ?? "Auftrag wählen"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {orders.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    Keine Aufträge vorhanden
                  </div>
                ) : (
                  orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {fieldErrors.order_id && (
              <p className="text-xs text-danger">{fieldErrors.order_id[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Beschreibung *</Label>
            <Input
              id="description"
              name="description"
              placeholder="z.B. Elektroinstallation EG"
              className="h-11 rounded-xl"
              required
            />
            {fieldErrors.description && (
              <p className="text-xs text-danger">{fieldErrors.description[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="agreed_amount">Vereinbart (€)</Label>
              <Input
                id="agreed_amount"
                name="agreed_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoiced_amount">In Rechnung (€)</Label>
              <Input
                id="invoiced_amount"
                name="invoiced_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "active")}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue>
                  {(value) => {
                    if (value === "completed") return "Abgeschlossen"
                    if (value === "cancelled") return "Storniert"
                    return "Aktiv"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="cancelled">Storniert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl h-11"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isPending || !orderId || orders.length === 0}
              className="flex-1 rounded-xl font-semibold h-11"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Anlegen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
