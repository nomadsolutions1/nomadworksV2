"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/layout/page-header"
import { DashboardKPICards } from "@/components/modules/dashboard/dashboard-kpis"
import { DashboardWarnings } from "@/components/modules/dashboard/dashboard-warnings"
import { DashboardClockedIn } from "@/components/modules/dashboard/dashboard-clocked-in"
import { DashboardOnboarding } from "@/components/modules/dashboard/dashboard-onboarding"
import { Clock, HardHat, Timer } from "lucide-react"
import Link from "next/link"
import type {
  DashboardKPIs,
  DashboardWarning,
  ClockedInEmployee,
  ActivityItem,
  OnboardingStatus,
  TrialStatus,
} from "@/lib/actions/dashboard"
import type { OpenTimeEntry } from "@/lib/actions/time-entries"

interface DashboardContentProps {
  kpis: DashboardKPIs
  warnings: DashboardWarning[]
  clockedIn: ClockedInEmployee[]
  activities: ActivityItem[]
  onboarding: OnboardingStatus
  trial: TrialStatus | null
  firstName: string | null
  greeting: string
  isEmpty: boolean
  utilization: number
  openEntry?: OpenTimeEntry | null
}

export function DashboardContent({
  kpis,
  warnings,
  clockedIn,
  activities,
  onboarding,
  trial,
  firstName,
  greeting,
  isEmpty,
  utilization,
  openEntry,
}: DashboardContentProps) {
  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {trial?.isOnTrial && (
        <div
          className={`flex items-center justify-between rounded-2xl px-5 py-3.5 ${
            trial.daysLeft <= 2
              ? "bg-danger/10 border border-danger/30"
              : "bg-accent/10 border border-accent/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <Timer
              className={`h-5 w-5 shrink-0 ${
                trial.daysLeft <= 2 ? "text-danger" : "text-accent"
              }`}
            />
            <div>
              <p
                className={`text-sm font-semibold ${
                  trial.daysLeft <= 2
                    ? "text-danger"
                    : "text-accent-foreground"
                }`}
              >
                {trial.daysLeft === 0
                  ? "Ihre Testphase ist heute abgelaufen"
                  : `Noch ${trial.daysLeft} ${
                      trial.daysLeft === 1 ? "Tag" : "Tage"
                    } in der kostenlosen Testphase`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Alle Features verfuegbar. Upgraden Sie jetzt fuer
                unterbrechungsfreien Zugriff.
              </p>
            </div>
          </div>
          <Link
            href="/firma?tab=abo"
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            aria-label="Jetzt auf ein kostenpflichtiges Abo upgraden"
          >
            Jetzt upgraden
          </Link>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title={`${greeting}${firstName ? `, ${firstName}` : ""}`}
        description={
          isEmpty
            ? "Willkommen bei NomadWorks! Richten Sie Ihr Unternehmen ein."
            : "Hier ist die Übersicht Ihres Unternehmens."
        }
      />

      {/* Clock-in prompt */}
      {!isEmpty && (
        <Card
          className={`rounded-2xl shadow-sm ${
            openEntry
              ? "bg-success/5 border-success/20"
              : "border-primary/10"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl p-2.5 ${
                  openEntry ? "bg-success/10" : "bg-primary/10"
                }`}
              >
                <Clock
                  className={`h-5 w-5 ${
                    openEntry ? "text-success" : "text-primary"
                  }`}
                />
              </div>
              <div>
                {openEntry ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      Eingestempelt seit{" "}
                      {new Date(openEntry.clock_in).toLocaleTimeString(
                        "de-DE",
                        { hour: "2-digit", minute: "2-digit" }
                      )}{" "}
                      auf {openEntry.site_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Zum Ausstempeln klicken Sie auf den Button.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      Heute auf der Baustelle?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stempeln Sie sich ein, um Ihre Arbeitszeit zu erfassen.
                    </p>
                  </>
                )}
              </div>
            </div>
            <Link href="/stempeln">
              <button
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors ${
                  openEntry
                    ? "bg-success hover:bg-success/90"
                    : "bg-primary hover:bg-primary/90"
                }`}
                aria-label={
                  openEntry ? "Jetzt ausstempeln" : "Jetzt einstempeln"
                }
              >
                <HardHat className="h-4 w-4" />
                {openEntry ? "Ausstempeln" : "Einstempeln"}
              </button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Conditional: Empty onboarding or full dashboard */}
      {isEmpty ? (
        <DashboardOnboarding onboarding={onboarding} showFullEmpty />
      ) : (
        <>
          <DashboardWarnings warnings={warnings} />
          <DashboardKPICards kpis={kpis} utilization={utilization} />
          <DashboardClockedIn
            clockedIn={clockedIn}
            activities={activities}
          />
          <DashboardOnboarding
            onboarding={onboarding}
            showFullEmpty={false}
          />
        </>
      )}
    </div>
  )
}
