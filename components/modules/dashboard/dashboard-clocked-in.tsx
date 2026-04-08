"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityFeed } from "@/components/shared/activity-feed"
import { Clock, ClipboardList } from "lucide-react"
import type { ClockedInEmployee, ActivityItem } from "@/lib/actions/dashboard"

interface DashboardClockedInProps {
  clockedIn: ClockedInEmployee[]
  activities: ActivityItem[]
}

export function DashboardClockedIn({
  clockedIn,
  activities,
}: DashboardClockedInProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Clocked-In Employees */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold font-heading">
              Eingestempelt
            </CardTitle>
            {clockedIn.length > 0 && (
              <span className="flex h-6 items-center rounded-full bg-success/10 px-2.5 text-xs font-semibold text-success">
                {clockedIn.length} aktiv
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {clockedIn.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Noch niemand eingestempelt
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {clockedIn.map((emp) => {
                const clockInTime = new Date(emp.clockIn)
                const hours = clockInTime
                  .getHours()
                  .toString()
                  .padStart(2, "0")
                const mins = clockInTime
                  .getMinutes()
                  .toString()
                  .padStart(2, "0")
                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between rounded-xl bg-muted p-3 hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {emp.name}
                        </span>
                        {emp.siteName && (
                          <p className="text-xs text-muted-foreground">
                            {emp.siteName}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono tabular-nums">
                      seit {hours}:{mins}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold font-heading">
            Aktivitaeten
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Noch keine Aktivitaeten
              </p>
            </div>
          ) : (
            <ActivityFeed items={activities} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
