import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-2xl bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold font-heading text-foreground mb-1">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {action && action.href ? (
        <Link href={action.href}>
          <Button className="rounded-xl font-semibold">
            {action.label}
          </Button>
        </Link>
      ) : action && action.onClick ? (
        <Button
          onClick={action.onClick}
          className="rounded-xl font-semibold"
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
