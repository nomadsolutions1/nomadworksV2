"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import type { DashboardWarning } from "@/lib/actions/dashboard"

interface DashboardWarningsProps {
  warnings: DashboardWarning[]
}

export function DashboardWarnings({ warnings }: DashboardWarningsProps) {
  if (warnings.length === 0) {
    return (
      <Card className="rounded-2xl shadow-sm border-success/30 bg-success/5">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="text-sm text-success font-medium">
            Alles in Ordnung — keine offenen Warnungen.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-sm border-accent/30 bg-accent/5 overflow-hidden">
      <CardContent className="p-0">
        {warnings.map((w, i) => (
          <Link
            key={w.id}
            href={w.link}
            className={`flex items-center gap-3 px-5 py-3 hover:bg-accent/10 transition-colors ${
              i > 0 ? "border-t border-accent/20" : ""
            }`}
            aria-label={w.message}
          >
            {w.severity === "danger" ? (
              <AlertCircle className="h-4.5 w-4.5 text-danger shrink-0" />
            ) : (
              <AlertTriangle className="h-4.5 w-4.5 text-accent shrink-0" />
            )}
            <span
              className={`text-sm flex-1 ${
                w.severity === "danger"
                  ? "text-danger font-medium"
                  : "text-accent-foreground"
              }`}
            >
              {w.message}
            </span>
            <ArrowRight className="h-4 w-4 text-accent-foreground/50 shrink-0" />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
