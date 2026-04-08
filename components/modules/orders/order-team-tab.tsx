import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { ROLE_LABELS } from "@/lib/utils/constants"
import { HardHat } from "lucide-react"
import type { OrderTeamMember } from "@/lib/actions/orders"

interface OrderTeamTabProps {
  team: OrderTeamMember[]
}

export function OrderTeamTab({ team }: OrderTeamTabProps) {
  if (team.length === 0) {
    return (
      <EmptyState
        icon={HardHat}
        title="Kein Team zugewiesen"
        description="Mitarbeiter, die Zeiten auf diesen Auftrag buchen, erscheinen hier automatisch."
      />
    )
  }

  return (
    <div className="space-y-3">
      {team.map((member) => (
        <Card key={member.id} className="rounded-2xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <HardHat className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[member.role] ?? member.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-semibold text-primary">{member.hours} Std.</p>
              <p className="text-xs text-muted-foreground">Geleistete Stunden</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
