import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import type { LucideIcon } from "lucide-react"

interface StatDef {
  title: string
  value: string | number
  context?: string
  icon: LucideIcon
}

interface ModulePageSkeletonProps {
  title: string
  description: string
  actionLabel?: string
  stats: StatDef[]
  tableHeaders: string[]
  tableRows?: string[][]
  children?: React.ReactNode
}

export function ModulePageSkeleton({
  title,
  description,
  actionLabel,
  stats,
  tableHeaders,
  tableRows,
  children,
}: ModulePageSkeletonProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        action={actionLabel ? { label: actionLabel } : undefined}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {children}

      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted">
                  {tableHeaders.map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows ? (
                  tableRows.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted even:bg-muted/30">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-3 text-sm">{cell}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {tableHeaders.map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-24 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
