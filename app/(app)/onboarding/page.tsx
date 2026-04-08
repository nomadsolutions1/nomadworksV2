import { getOnboardingData } from "@/lib/actions/onboarding"
import { OnboardingWizard } from "@/components/modules/onboarding/onboarding-wizard"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Einrichtung" }

export default async function OnboardingPage() {
  const { data, error } = await getOnboardingData()

  if (error || !data) {
    redirect("/dashboard")
  }

  return <OnboardingWizard company={data.company} firstName={data.firstName} />
}
