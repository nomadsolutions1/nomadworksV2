"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { Vehicle } from "@/lib/actions/fleet"

// ─── Primitive fields ────────────────────────────────────────

export function NumericField({
  id,
  label,
  defaultValue,
  placeholder,
  max,
}: {
  id: string
  label: string
  defaultValue: number | null | undefined
  placeholder: string
  max?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="number"
        step="0.01"
        min={0}
        max={max}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="h-11 rounded-xl"
      />
    </div>
  )
}

export function DateField({
  id,
  label,
  defaultValue,
}: {
  id: string
  label: string
  defaultValue: string | null | undefined
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="date"
        defaultValue={defaultValue ?? ""}
        className="h-11 rounded-xl"
      />
    </div>
  )
}

function ContractDates({
  vehicle,
  startLabel,
  endLabel,
}: {
  vehicle?: Vehicle
  startLabel: string
  endLabel: string
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <DateField id="contract_start" label={startLabel} defaultValue={vehicle?.contract_start} />
      <DateField id="contract_end" label={endLabel} defaultValue={vehicle?.contract_end} />
    </div>
  )
}

// ─── Acquisition Field Groups ────────────────────────────────

export function PurchaseFields({ vehicle }: { vehicle?: Vehicle }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NumericField
        id="purchase_price"
        label="Kaufpreis (€)"
        defaultValue={vehicle?.purchase_price}
        placeholder="85000.00"
      />
      <DateField id="purchase_date" label="Kaufdatum" defaultValue={vehicle?.purchase_date} />
    </div>
  )
}

export function FinancingFields({ vehicle }: { vehicle?: Vehicle }) {
  return (
    <>
      <Separator />
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumericField
            id="loan_amount"
            label="Darlehensbetrag (€)"
            defaultValue={vehicle?.loan_amount}
            placeholder="60000.00"
          />
          <NumericField
            id="down_payment"
            label="Anzahlung (€)"
            defaultValue={vehicle?.down_payment}
            placeholder="15000.00"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumericField
            id="monthly_rate"
            label="Monatliche Rate (€)"
            defaultValue={vehicle?.monthly_rate}
            placeholder="1200.00"
          />
          <NumericField
            id="interest_rate"
            label="Zinssatz (%)"
            defaultValue={vehicle?.interest_rate}
            placeholder="3.9"
            max={100}
          />
          <NumericField
            id="residual_value"
            label="Restwert (€)"
            defaultValue={vehicle?.residual_value}
            placeholder="20000.00"
          />
        </div>
        <ContractDates vehicle={vehicle} startLabel="Vertragsbeginn" endLabel="Vertragsende" />
      </div>
    </>
  )
}

export function LeasingFields({ vehicle }: { vehicle?: Vehicle }) {
  return (
    <>
      <Separator />
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumericField
            id="monthly_rate"
            label="Leasingrate (€/Monat)"
            defaultValue={vehicle?.monthly_rate}
            placeholder="950.00"
          />
          <NumericField
            id="down_payment"
            label="Sonderzahlung (€)"
            defaultValue={vehicle?.down_payment}
            placeholder="5000.00"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumericField
            id="residual_value"
            label="Restwert (€)"
            defaultValue={vehicle?.residual_value}
            placeholder="18000.00"
          />
          <DateField
            id="contract_start"
            label="Leasingbeginn"
            defaultValue={vehicle?.contract_start}
          />
          <DateField
            id="contract_end"
            label="Leasingende"
            defaultValue={vehicle?.contract_end}
          />
        </div>
      </div>
    </>
  )
}

export function RentalFields({ vehicle }: { vehicle?: Vehicle }) {
  return (
    <>
      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NumericField
          id="rental_daily_rate"
          label="Tagessatz (€/Tag)"
          defaultValue={vehicle?.rental_daily_rate}
          placeholder="180.00"
        />
        <DateField id="contract_start" label="Mietbeginn" defaultValue={vehicle?.contract_start} />
        <DateField id="contract_end" label="Mietende" defaultValue={vehicle?.contract_end} />
      </div>
    </>
  )
}
