import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Clock, Navigation, Phone } from "lucide-react"
import type { AssignedSiteInfo } from "@/lib/actions/time-entries"

interface AssignmentInfoProps {
  assignment: AssignedSiteInfo
}

const SHIFT_LABELS: Record<string, string> = {
  frueh: "Fruehschicht",
  spaet: "Spaetschicht",
  nacht: "Nachtschicht",
  ganztag: "Ganztag",
}

export function AssignmentInfo({ assignment }: AssignmentInfoProps) {
  const shiftLabel = SHIFT_LABELS[assignment.shift_type ?? ""] ?? "Ganztag"

  return (
    <Card className="rounded-2xl shadow-sm border-primary/10">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-foreground">{assignment.site_name}</h3>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Heute zugewiesen
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {shiftLabel}
              </span>
            </div>
            {assignment.site_address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(assignment.site_address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mt-1"
              >
                <Navigation className="h-3.5 w-3.5" />
                {assignment.site_address}
              </a>
            )}
            {assignment.foreman_name && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-muted-foreground">
                  Bauleiter: {assignment.foreman_name}
                </span>
                {assignment.foreman_phone && (
                  <a
                    href={`tel:${assignment.foreman_phone}`}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {assignment.foreman_phone}
                  </a>
                )}
              </div>
            )}
            {assignment.notes && (
              <p className="text-xs text-muted-foreground mt-1.5 italic">{assignment.notes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
