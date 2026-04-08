"use client"

import { PageHeader } from "@/components/layout/page-header"
import { CompanyForm } from "@/components/modules/settings/company-form"
import { InvoiceSettingsForm } from "@/components/modules/settings/invoice-settings-form"
import { SokaForm } from "@/components/modules/settings/soka-form"
import { TaxAdvisorForm } from "@/components/modules/settings/tax-advisor-form"
import { BillingTab } from "@/components/modules/settings/billing-tab"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"
import { Building2, FileText, Wrench, UserCheck, CreditCard } from "lucide-react"
import type { CompanySettings } from "@/lib/actions/settings"
import type { SubscriptionStatus } from "@/lib/actions/billing"

interface CompanyContentProps {
  settings: CompanySettings | null
  subscription: SubscriptionStatus | null
}

export function CompanyContent({ settings, subscription }: CompanyContentProps) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "abo" || searchParams.get("billing") ? "abo" : "firmendaten"

  return (
    <div className="space-y-6">
      <PageHeader title="Firmeneinstellungen" description="Verwalten Sie Ihre Firmendaten und Ihr Abonnement." />

      <Tabs defaultValue={defaultTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="firmendaten" className="rounded-lg">
            <Building2 className="h-4 w-4 mr-2" />
            Firmendaten
          </TabsTrigger>
          <TabsTrigger value="rechnung" className="rounded-lg">
            <FileText className="h-4 w-4 mr-2" />
            Rechnungen
          </TabsTrigger>
          <TabsTrigger value="soka" className="rounded-lg">
            <Wrench className="h-4 w-4 mr-2" />
            SOKA-Bau
          </TabsTrigger>
          <TabsTrigger value="steuerberater" className="rounded-lg">
            <UserCheck className="h-4 w-4 mr-2" />
            Steuerberater
          </TabsTrigger>
          <TabsTrigger value="abo" className="rounded-lg">
            <CreditCard className="h-4 w-4 mr-2" />
            Abonnement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="firmendaten" className="mt-6">
          {settings ? (
            <CompanyForm settings={settings} />
          ) : (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Firmendaten konnten nicht geladen werden.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rechnung" className="mt-6">
          {settings ? (
            <InvoiceSettingsForm settings={settings} />
          ) : (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Einstellungen konnten nicht geladen werden.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="soka" className="mt-6">
          {settings ? (
            <SokaForm settings={settings} />
          ) : (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Einstellungen konnten nicht geladen werden.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="steuerberater" className="mt-6">
          {settings ? (
            <TaxAdvisorForm settings={settings} />
          ) : (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Einstellungen konnten nicht geladen werden.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="abo" className="mt-6">
          <BillingTab
            subscription={subscription}
            currentPlan={settings?.plan ?? "trial"}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
