import { requireCompanyAuth } from "@/lib/utils/auth-helper"
import { getCompanySettings } from "@/lib/actions/settings"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { TaxAdvisorForm } from "@/components/modules/settings/tax-advisor-form"
import { DatevExportClient } from "@/components/modules/company/datev-export-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Steuerberater & DATEV-Export" }

export default async function SteuerberaterPage() {
  const { user, profile } = await requireCompanyAuth()
  if (!user || !profile) redirect("/login")
  if (!["owner", "super_admin"].includes(profile.role)) {
    redirect("/firma")
  }

  const { data: settings, error } = await getCompanySettings()

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Steuerberater</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hinterlegen Sie die Daten Ihres Steuerberaters, vergeben Sie einen Zugang und
            exportieren Sie Rechnungen oder Zeiten im DATEV-Format.
          </p>
        </div>
        <Link href="/firma" className="text-sm text-muted-foreground hover:text-foreground">
          Zurück
        </Link>
      </div>

      {error || !settings ? (
        <Card className="rounded-2xl border-danger/40 bg-danger/5">
          <CardContent className="p-4 text-sm text-danger">
            Die Steuerberater-Daten konnten nicht geladen werden. Bitte laden Sie die Seite
            neu oder kontaktieren Sie den Support.
          </CardContent>
        </Card>
      ) : (
        <TaxAdvisorForm settings={settings} />
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">DATEV-Export</CardTitle>
          <p className="text-sm text-muted-foreground">
            Wählen Sie einen Zeitraum und laden Sie die Daten als DATEV-kompatibles CSV
            herunter. Ihr Steuerberater kann die Datei direkt in DATEV importieren.
          </p>
        </CardHeader>
        <CardContent>
          <DatevExportClient />
        </CardContent>
      </Card>
    </div>
  )
}
