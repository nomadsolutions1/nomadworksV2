import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    icon?: LucideIcon
    onClick?: () => void
    href?: string
  }
  children?: React.ReactNode
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  const ActionButton = action ? (
    <Button className="rounded-xl font-semibold" onClick={action.onClick}>
      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
      {action.label}
    </Button>
  ) : null

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold font-heading text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {action && action.href ? (
          <Link href={action.href}>{ActionButton}</Link>
        ) : (
          ActionButton
        )}
      </div>
    </div>
  )
}
