"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { updateOrderStatus } from "@/lib/actions/orders"
import type { OrderStatus } from "@/lib/actions/orders"
import { ORDER_STATUSES, getOrderStatusConfig } from "@/lib/utils/constants"
import { ChevronDown, Loader2 } from "lucide-react"

interface OrderStatusChangerProps {
  orderId: string
  currentStatus: string
}

export function OrderStatusChanger({ orderId, currentStatus }: OrderStatusChangerProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()
  const cfg = getOrderStatusConfig(status)

  function handleChange(newStatus: OrderStatus) {
    if (newStatus === status) return
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus)
      if (result.error) { toast.error("Fehler beim Ändern des Status"); return }
      setStatus(newStatus)
      toast.success("Status wurde geändert")
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="rounded-xl h-11 gap-2 font-medium" disabled={isPending} />}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {cfg.label}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        {Object.entries(ORDER_STATUSES).map(([key, val]) => (
          <DropdownMenuItem key={key} className="gap-2 cursor-pointer" onClick={() => handleChange(key as OrderStatus)}>
            {val.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
