import { getCompanySettings } from "@/lib/actions/settings"
import { getSubscriptionStatus } from "@/lib/actions/billing"
import { CompanyContent } from "@/components/modules/company/company-content"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Firmeneinstellungen" }

export default async function FirmaPage() {
  const [{ data: settings }, { data: subscription }] = await Promise.all([
    getCompanySettings(),
    getSubscriptionStatus(),
  ])

  return <CompanyContent settings={settings} subscription={subscription ?? null} />
}
