"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updatePurchaseOrderStatus, addPurchaseOrderItem } from "@/lib/actions/inventory"
import type { PurchaseOrder, Material } from "@/lib/actions/inventory"

type POStatus = "draft" | "ordered" | "partially_delivered" | "delivered" | "cancelled"

interface Props {
  order: PurchaseOrder
  materials: Material[]
}

const STATUS_OPTIONS: { value: POStatus; label: string }[] = [
  { value: "draft", label: "Entwurf" },
  { value: "ordered", label: "Bestellt" },
  { value: "partially_delivered", label: "Teilgeliefert" },
  { value: "delivered", label: "Geliefert" },
  { value: "cancelled", label: "Storniert" },
]

export function PurchaseOrderActions({ order, materials }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [addOpen, setAddOpen] = useState(false)
  const [materialId, setMaterialId] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  function handleStatusChange(status: POStatus) {
    startTransition(async () => {
      const result = await updatePurchaseOrderStatus(order.id, status)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Status aktualisiert")
        router.refresh()
      }
    })
  }

  async function handleAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    const formData = new FormData(e.currentTarget)
    formData.set("material_id", materialId)

    startTransition(async () => {
      const result = await addPurchaseOrderItem(order.id, formData)
      if (result?.error) {
        if (typeof result.error === "string") {
          toast.error(result.error)
        } else {
          setFieldErrors(result.error)
        }
        return
      }
      if (result?.success) {
        toast.success("Position hinzugefügt")
        setAddOpen(false)
        setMaterialId("")
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger
          render={
            <Button variant="outline" className="rounded-xl gap-2">
              <Plus className="h-4 w-4" />
              Position
            </Button>
          }
        >
          {}
        </DialogTrigger>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Position hinzufügen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Material *</Label>
              <Select value={materialId} onValueChange={(v) => setMaterialId(v ?? "")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Material wählen">
                    {(value) => materials.find((m) => m.id === value)?.name ?? "Material wählen"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pa-qty">Menge *</Label>
                <Input
                  id="pa-qty"
                  name="quantity"
                  type="number"
                  step="0.01"
                  min={0.01}
                  placeholder="0"
                  className="h-11 rounded-xl"
                  required
                />
                {fieldErrors.quantity && (
                  <p className="text-xs text-danger">{fieldErrors.quantity[0]}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pa-price">Einzelpreis (€) *</Label>
                <Input
                  id="pa-price"
                  name="unit_price"
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="0,00"
                  className="h-11 rounded-xl"
                  required
                />
                {fieldErrors.unit_price && (
                  <p className="text-xs text-danger">{fieldErrors.unit_price[0]}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setAddOpen(false)}
                disabled={isPending}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                className="rounded-xl font-semibold"
                disabled={isPending || !materialId}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Hinzufügen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button className="rounded-xl font-semibold gap-2" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Status
              <ChevronDown className="h-4 w-4" />
            </Button>
          }
        >
          {}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          {STATUS_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`cursor-pointer rounded-lg ${
                order.status === opt.value ? "font-semibold" : ""
              }`}
            >
              {order.status === opt.value ? "✓ " : ""}
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
