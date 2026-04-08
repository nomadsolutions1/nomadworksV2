import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        danger: "bg-danger/10 text-danger",
        info: "bg-primary/10 text-primary",
        neutral: "bg-muted text-muted-foreground",
        accent: "bg-accent/10 text-accent",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

const dotVariants = cva("h-1.5 w-1.5 rounded-full", {
  variants: {
    variant: {
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
      info: "bg-primary",
      neutral: "bg-muted-foreground",
      accent: "bg-accent",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
})

export type StatusBadgeVariant = NonNullable<VariantProps<typeof statusBadgeVariants>["variant"]>

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  label: string
  className?: string
  showDot?: boolean
}

export function StatusBadge({ label, variant, className, showDot = true }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)}>
      {showDot && <span className={dotVariants({ variant })} />}
      {label}
    </span>
  )
}
