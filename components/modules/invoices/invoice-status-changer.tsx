"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateInvoiceStatus } from "@/lib/actions/invoices"
import type { InvoiceStatus } from "@/lib/actions/invoices"
import { INVOICE_STATUSES } from "@/lib/utils/constants"
import { StatusBadge } from "@/components/shared/status-badge"
import { ChevronDown, Loader2 } from "lucide-react"

interface InvoiceStatusChangerProps {
  invoiceId: string
  currentStatus: InvoiceStatus
}

const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["sent"],
  sent: ["paid", "overdue"],
  paid: [],
  overdue: ["paid"],
}

const STATUS_VARIANT_MAP: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "danger",
}

export function InvoiceStatusChanger({
  invoiceId,
  currentStatus,
}: InvoiceStatusChangerProps) {
  const [status, setStatus] = useState<InvoiceStatus>(currentStatus)
  const [isPending, startTransition] = useTransition()

  const transitions = STATUS_TRANSITIONS[status] ?? []
  const cfg = INVOICE_STATUSES[status]

  async function handleChange(newStatus: InvoiceStatus) {
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceId, newStatus)
      if (result.error) {
        toast.error("Status konnte nicht geaendert werden")
        return
      }
      setStatus(newStatus)
      const newCfg = INVOICE_STATUSES[newStatus]
      toast.success(`Status auf "${newCfg?.label ?? newStatus}" gesetzt`)
    })
  }

  if (transitions.length === 0) {
    return (
      <StatusBadge
        label={cfg?.label ?? status}
        variant={STATUS_VARIANT_MAP[status] ?? "neutral"}
      />
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            disabled={isPending}
            className="rounded-xl h-9 gap-2 text-sm"
            aria-label={`Status aendern, aktuell: ${cfg?.label ?? status}`}
          />
        }
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <StatusBadge
            label={cfg?.label ?? status}
            variant={STATUS_VARIANT_MAP[status] ?? "neutral"}
          />
        )}
        <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        {transitions.map((s) => {
          const sCfg = INVOICE_STATUSES[s]
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => handleChange(s)}
              className="rounded-lg gap-2"
            >
              <StatusBadge
                label={sCfg?.label ?? s}
                variant={STATUS_VARIANT_MAP[s] ?? "neutral"}
              />
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
