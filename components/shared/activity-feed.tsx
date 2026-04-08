import { formatRelativeTime } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  message: string
  timestamp: string
  type: "info" | "success" | "warning" | "danger"
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

const dotColors: Record<ActivityItem["type"], string> = {
  info: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn("h-2.5 w-2.5 rounded-full mt-1.5 shrink-0", dotColors[item.type])}
            />
            <div className="flex-1 w-px bg-border mt-1" />
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm text-foreground">{item.message}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatRelativeTime(item.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
