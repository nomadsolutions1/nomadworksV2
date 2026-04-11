"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils/format"
import { SubcontractorForm } from "@/components/modules/subcontractors/subcontractor-form"
import { SubcontractorAssignmentList } from "@/components/modules/subcontractors/subcontractor-assignment-list"
import {
  TaxExemptionBadge,
  getTaxExemptionStatus,
} from "@/components/modules/subcontractors/tax-exemption-badge"
import { RatingDisplay } from "@/components/modules/subcontractors/rating-display"
import {
  Handshake,
  AlertTriangle,
  CheckCircle2,
  Euro,
  Briefcase,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
} from "lucide-react"
import type {
  Subcontractor,
  SubcontractorAssignment,
} from "@/lib/actions/subcontractors"

interface SubcontractorDetailProps {
  sub: Subcontractor
  assignments: SubcontractorAssignment[]
  orderOptions: Array<{ id: string; title: string }>
}

export function SubcontractorDetail({
  sub,
  assignments,
  orderOptions,
}: SubcontractorDetailProps) {
  const status48b = getTaxExemptionStatus(sub.tax_exemption_valid_until)
  const totalAgreed = assignments.reduce((s, a) => s + (a.agreed_amount ?? 0), 0)
  const totalInvoiced = assignments.reduce((s, a) => s + (a.invoiced_amount ?? 0), 0)
  const activeAssignments = assignments.filter((a) => a.status === "active").length

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Subunternehmer", href: "/subunternehmer" },
          { label: sub.name },
        ]}
      />

      <PageHeader title={sub.name} description={sub.trade ?? undefined} />

      {/* §48b Warnings */}
      {status48b === "expired" && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-danger">
            §48b Freistellungsbescheinigung ist abgelaufen. Ohne gültige Bescheinigung muss die
            Bauabzugssteuer (15%) einbehalten werden.
          </p>
        </div>
      )}
      {status48b === "expiring" && sub.tax_exemption_valid_until && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-warning">
            §48b Freistellungsbescheinigung läuft am{" "}
            {new Date(sub.tax_exemption_valid_until).toLocaleDateString("de-DE")} ab. Bitte
            rechtzeitig erneuern.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Aktive Einsätze" value={activeAssignments} icon={Briefcase} />
        <StatCard
          title="Vereinbart gesamt"
          value={totalAgreed > 0 ? formatCurrency(totalAgreed) : "—"}
          icon={Euro}
        />
        <StatCard
          title="In Rechnung gestellt"
          value={totalInvoiced > 0 ? formatCurrency(totalInvoiced) : "—"}
          icon={FileText}
        />
        <StatCard
          title="§48b Status"
          value={
            status48b === "valid"
              ? "Gültig"
              : status48b === "expiring"
              ? "Läuft ab"
              : status48b === "expired"
              ? "Abgelaufen"
              : "Nicht hinterlegt"
          }
          icon={status48b === "valid" ? CheckCircle2 : AlertTriangle}
          className={
            status48b === "expired"
              ? "border-danger/40"
              : status48b === "expiring"
              ? "border-warning/40"
              : undefined
          }
        />
      </div>

      <Tabs defaultValue="stammdaten" className="space-y-4">
        <TabsList className="rounded-xl bg-muted p-1 h-auto gap-1">
          <TabsTrigger value="stammdaten" className="rounded-lg text-sm">
            <Handshake className="h-3.5 w-3.5 mr-1.5" />
            Stammdaten
          </TabsTrigger>
          <TabsTrigger value="einsaetze" className="rounded-lg text-sm">
            <Briefcase className="h-3.5 w-3.5 mr-1.5" />
            Einsätze ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="bewertung" className="rounded-lg text-sm">
            Bewertung
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stammdaten" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Kontakt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sub.contact_person && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{sub.contact_person}</span>
                  </div>
                )}
                {sub.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={`mailto:${sub.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {sub.email}
                    </a>
                  </div>
                )}
                {sub.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={`tel:${sub.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {sub.phone}
                    </a>
                  </div>
                )}
                {sub.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{sub.address}</span>
                  </div>
                )}
                {!sub.contact_person && !sub.email && !sub.phone && !sub.address && (
                  <p className="text-sm text-muted-foreground">Keine Kontaktdaten hinterlegt</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                  §48b &amp; §13b
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">§48b Bescheinigung</span>
                  <TaxExemptionBadge
                    validUntil={sub.tax_exemption_valid_until}
                    showDate
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">§13b Reverse Charge</span>
                  <span className="text-sm font-medium text-foreground">
                    {sub.reverse_charge_13b ? "Aktiv" : "Nicht aktiv"}
                  </span>
                </div>
                {sub.reverse_charge_13b && sub.reverse_charge_certificate_valid_until && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">§13b Nachweis bis</span>
                    <span className="text-sm font-medium text-foreground">
                      {new Date(
                        sub.reverse_charge_certificate_valid_until
                      ).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {sub.notes && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sub.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Daten bearbeiten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SubcontractorForm subcontractor={sub} mode="edit" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="einsaetze">
          <SubcontractorAssignmentList
            subcontractorId={sub.id}
            assignments={assignments}
            orders={orderOptions}
          />
        </TabsContent>

        <TabsContent value="bewertung">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Aktuelle Bewertung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Qualität</span>
                <RatingDisplay value={sub.quality_rating} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Zuverlässigkeit</span>
                <RatingDisplay value={sub.reliability_rating} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preis-Leistung</span>
                <RatingDisplay value={sub.price_rating} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Bewertung über den Tab &quot;Stammdaten&quot; &rarr; &quot;Daten bearbeiten&quot;
                anpassen.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
