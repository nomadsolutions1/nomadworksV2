"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge, type StatusBadgeVariant } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { SubcontractorAssignmentDialog } from "@/components/modules/subcontractors/subcontractor-assignment-dialog"
import { formatCurrency } from "@/lib/utils/format"
import {
  deleteAssignment,
  markAssignmentCompleted,
} from "@/lib/actions/subcontractors"
import type { SubcontractorAssignment } from "@/lib/actions/subcontractors"
import { Briefcase, Trash2, ExternalLink, CheckCircle2, Loader2 } from "lucide-react"

interface OrderOption {
  id: string
  title: string
}

interface AssignmentListProps {
  subcontractorId: string
  assignments: SubcontractorAssignment[]
  orders: OrderOption[]
}

const STATUS_META: Record<string, { label: string; variant: StatusBadgeVariant }> = {
  active: { label: "Aktiv", variant: "success" },
  completed: { label: "Abgeschlossen", variant: "neutral" },
  cancelled: { label: "Storniert", variant: "danger" },
}

export function SubcontractorAssignmentList({
  subcontractorId,
  assignments,
  orders,
}: AssignmentListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAssignment(id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Einsatz gelöscht")
      router.refresh()
    })
  }

  function handleComplete(id: string) {
    startTransition(async () => {
      const result = await markAssignmentCompleted(id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Einsatz abgeschlossen")
      router.refresh()
    })
  }

  const totalAgreed = assignments.reduce((s, a) => s + (a.agreed_amount ?? 0), 0)
  const totalInvoiced = assignments.reduce((s, a) => s + (a.invoiced_amount ?? 0), 0)

  return (
    <div className="space-y-4">
      {assignments.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">
                Vereinbart gesamt
              </p>
              <p className="text-xl font-semibold text-foreground mt-1 font-mono">
                {totalAgreed > 0 ? formatCurrency(totalAgreed) : "—"}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">
                In Rechnung gestellt
              </p>
              <p className="text-xl font-semibold text-foreground mt-1 font-mono">
                {totalInvoiced > 0 ? formatCurrency(totalInvoiced) : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          Einsätze ({assignments.length})
        </h3>
        <SubcontractorAssignmentDialog
          subcontractorId={subcontractorId}
          orders={orders}
        />
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Keine Einsätze vorhanden"
          description="Weisen Sie diesen Subunternehmer einem Auftrag zu, um Kosten und Fortschritt zu verfolgen."
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const meta = STATUS_META[a.status] ?? STATUS_META.active
            return (
              <Card
                key={a.id}
                className="rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {a.order_title && (
                          <Link
                            href={`/auftraege/${a.order_id}`}
                            className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                          >
                            {a.order_title}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        <StatusBadge label={meta.label} variant={meta.variant} />
                      </div>
                      {a.description && (
                        <p className="text-sm text-muted-foreground mb-2">{a.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {a.agreed_amount != null && (
                          <span>
                            <span className="font-medium">Vereinbart:</span>{" "}
                            <span className="font-mono text-foreground">
                              {formatCurrency(a.agreed_amount)}
                            </span>
                          </span>
                        )}
                        {a.invoiced_amount != null && (
                          <span>
                            <span className="font-medium">In Rechnung:</span>{" "}
                            <span className="font-mono text-foreground">
                              {formatCurrency(a.invoiced_amount)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {a.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success hover:text-success hover:bg-success/10 rounded-lg"
                          disabled={isPending}
                          onClick={() => handleComplete(a.id)}
                          title="Als abgeschlossen markieren"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <ConfirmDialog
                        title="Einsatz löschen?"
                        description="Dieser Einsatz wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
                        confirmLabel="Löschen"
                        destructive
                        onConfirm={() => handleDelete(a.id)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:text-danger hover:bg-danger/10 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
