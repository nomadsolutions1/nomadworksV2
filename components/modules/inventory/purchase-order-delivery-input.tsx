"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { updatePurchaseOrderItemDelivery } from "@/lib/actions/inventory"
import { useRouter } from "next/navigation"

interface Props {
  itemId: string
  orderId: string
  quantityOrdered: number
  quantityDelivered: number
  unit: string
}

export function PurchaseOrderDeliveryInput({
  itemId,
  orderId,
  quantityOrdered,
  quantityDelivered,
  unit,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(quantityDelivered.toString())

  const isFullyDelivered = quantityDelivered >= quantityOrdered

  function handleSave() {
    const qty = parseFloat(value.replace(",", "."))
    if (isNaN(qty) || qty < 0) {
      toast.error("Ungültige Menge")
      return
    }

    startTransition(async () => {
      const result = await updatePurchaseOrderItemDelivery(itemId, orderId, qty)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Liefermenge aktualisiert")
        router.refresh()
      }
    })
  }

  if (isFullyDelivered) {
    return (
      <div className="flex items-center gap-1 text-xs text-success font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Vollständig
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        step="0.01"
        min={0}
        max={quantityOrdered}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-20 text-sm rounded-lg"
        placeholder="0"
      />
      <span className="text-xs text-muted-foreground">{unit}</span>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={isPending}
        className="h-8 rounded-lg px-2"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "OK"}
      </Button>
    </div>
  )
}
