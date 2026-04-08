import {
  getDashboardKPIs,
  getDashboardWarnings,
  getClockedInEmployees,
  getActivityFeed,
  getOnboardingStatus,
  getTrialStatus,
  getCurrentUserFirstName,
} from "@/lib/actions/dashboard"
import { getGreeting } from "@/lib/utils/dates"
import { DashboardContent } from "@/components/modules/dashboard/dashboard-content"
import { TipsBanner } from "@/components/shared/tips-banner"
import { getMyOpenEntry } from "@/lib/actions/time-entries"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const [
    kpis,
    warnings,
    clockedIn,
    activities,
    onboarding,
    trial,
    firstName,
    openEntryResult,
  ] = await Promise.all([
    getDashboardKPIs(),
    getDashboardWarnings(),
    getClockedInEmployees(),
    getActivityFeed(),
    getOnboardingStatus(),
    getTrialStatus(),
    getCurrentUserFirstName(),
    getMyOpenEntry(),
  ])

  const greeting = getGreeting()
  const isEmpty =
    kpis.employees.total <= 1 &&
    kpis.sites.total === 0 &&
    kpis.orders.total === 0
  const utilization =
    kpis.employees.total > 0
      ? Math.round(
          (kpis.hoursToday.clockedIn / kpis.employees.total) * 100
        )
      : 0

  return (
    <>
      <TipsBanner module="dashboard" />
      <DashboardContent
        kpis={kpis}
        warnings={warnings}
        clockedIn={clockedIn}
        activities={activities}
        onboarding={onboarding}
        trial={trial}
        firstName={firstName}
        greeting={greeting}
        isEmpty={isEmpty}
        utilization={utilization}
        openEntry={openEntryResult.data ?? null}
      />
    </>
  )
}
