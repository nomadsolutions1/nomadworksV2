"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { StatusBadge } from "@/components/shared/status-badge"
import { VehicleForm } from "@/components/modules/fleet/vehicle-form"
import { FuelLogDialog } from "@/components/modules/fleet/fuel-log-dialog"
import { TripLogDialog } from "@/components/modules/fleet/trip-log-dialog"
import { TuvWarningBanner } from "@/components/modules/fleet/tuv-warning-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VEHICLE_STATUSES, VEHICLE_TYPE_LABELS } from "@/lib/utils/constants"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils/format"
import type { Vehicle, FuelEntry, TripEntry } from "@/lib/actions/fleet"

interface VehicleDetailProps {
  vehicle: Vehicle
  fuelEntries: FuelEntry[]
  tripEntries: TripEntry[]
}

export function VehicleDetail({ vehicle, fuelEntries, tripEntries }: VehicleDetailProps) {
  const v = vehicle
  const statusInfo =
    VEHICLE_STATUSES[(v.availability_status ?? "available") as keyof typeof VEHICLE_STATUSES] ??
    VEHICLE_STATUSES.available

  const monthlyCosts = (v.insurance_cost ?? 0) + (v.tax_cost ?? 0) + (v.leasing_cost ?? 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Fuhrpark", href: "/fuhrpark" },
          { label: "Fahrzeuge", href: "/fuhrpark/fahrzeuge" },
          { label: v.license_plate },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold font-heading text-foreground">
              {v.make} {v.model}
            </h1>
            <span className="font-mono text-lg text-muted-foreground">{v.license_plate}</span>
            <StatusBadge variant={statusInfo.variant} label={statusInfo.label} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {v.type && (
              <span>{VEHICLE_TYPE_LABELS[v.type as keyof typeof VEHICLE_TYPE_LABELS] ?? v.type}</span>
            )}
            {v.year && <span> · Baujahr {v.year}</span>}
            {v.mileage && <span> · {formatNumber(v.mileage)} km</span>}
          </p>
        </div>
      </div>

      <TuvWarningBanner nextInspection={v.next_inspection} label="TÜV" />

      <Tabs defaultValue="details">
        <TabsList className="rounded-xl">
          <TabsTrigger value="details" className="rounded-lg">
            Details
          </TabsTrigger>
          <TabsTrigger value="tankbuch" className="rounded-lg">
            Tankbuch ({fuelEntries.length})
          </TabsTrigger>
          <TabsTrigger value="fahrtenbuch" className="rounded-lg">
            Fahrtenbuch ({tripEntries.length})
          </TabsTrigger>
          <TabsTrigger value="finanzierung" className="rounded-lg">
            Finanzierung
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <VehicleForm vehicle={vehicle} mode="edit" />
        </TabsContent>

        <TabsContent value="tankbuch" className="mt-4">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <FuelLogDialog vehicleId={v.id} entries={fuelEntries} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fahrtenbuch" className="mt-4">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <TripLogDialog vehicleId={v.id} entries={tripEntries} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finanzierung" className="mt-4">
          <FinancingTab vehicle={v} monthlyCosts={monthlyCosts} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FinancingTab({
  vehicle: v,
  monthlyCosts,
}: {
  vehicle: Vehicle
  monthlyCosts: number
}) {
  if (!v.acquisition_type && monthlyCosts === 0) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Keine Finanzierungsdaten hinterlegt. Bearbeiten Sie das Fahrzeug, um Beschaffungs- und
          Kostendaten zu erfassen.
        </CardContent>
      </Card>
    )
  }

  const acquisitionLabel =
    v.acquisition_type === "purchase"
      ? "Kauf"
      : v.acquisition_type === "financing"
        ? "Finanzierung"
        : v.acquisition_type === "leasing"
          ? "Leasing"
          : v.acquisition_type === "rental"
            ? "Miete"
            : null

  return (
    <div className="space-y-4">
      {monthlyCosts > 0 && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Monatliche Kosten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {v.insurance_cost && v.insurance_cost > 0 && (
              <Row label="Versicherung" value={formatCurrency(v.insurance_cost)} />
            )}
            {v.tax_cost && v.tax_cost > 0 && (
              <Row label="KFZ-Steuer" value={formatCurrency(v.tax_cost)} />
            )}
            {v.leasing_cost && v.leasing_cost > 0 && (
              <Row label="Rate / Leasing" value={formatCurrency(v.leasing_cost)} />
            )}
            <div className="border-t pt-3 flex justify-between text-sm font-semibold">
              <span className="text-foreground">Gesamt / Monat</span>
              <span className="text-primary text-base">{formatCurrency(monthlyCosts)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {acquisitionLabel && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Beschaffungsdetails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Beschaffungsart" value={acquisitionLabel} />
            {v.purchase_price && (
              <Row label="Kaufpreis" value={formatCurrency(v.purchase_price)} />
            )}
            {v.purchase_date && <Row label="Kaufdatum" value={formatDate(v.purchase_date)} />}
            {v.loan_amount && (
              <Row label="Darlehensbetrag" value={formatCurrency(v.loan_amount)} />
            )}
            {v.down_payment && (
              <Row label="Anzahlung / Sonderzahlung" value={formatCurrency(v.down_payment)} />
            )}
            {v.monthly_rate && (
              <Row label="Monatliche Rate" value={formatCurrency(v.monthly_rate)} />
            )}
            {v.interest_rate && <Row label="Zinssatz" value={`${v.interest_rate} %`} />}
            {v.residual_value && (
              <Row label="Restwert" value={formatCurrency(v.residual_value)} />
            )}
            {v.rental_daily_rate && (
              <Row label="Tagessatz (Miete)" value={formatCurrency(v.rental_daily_rate)} />
            )}
            {v.contract_start && (
              <Row label="Vertragsbeginn" value={formatDate(v.contract_start)} />
            )}
            {v.contract_end && <Row label="Vertragsende" value={formatDate(v.contract_end)} />}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
