"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CurrencyInput } from "@/components/shared/currency-input"
import { HelpCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import { AG_ANTEIL_PROZENT } from "@/lib/utils/constants"
import type { Employee } from "@/lib/actions/employees"

const TAX_CLASS_OPTIONS = ["1", "2", "3", "4", "5", "6"]

interface EmployeeFormWageSectionProps {
  employee?: Employee
  mode: "create" | "edit"
}

export function EmployeeFormWageSection({ employee, mode }: EmployeeFormWageSectionProps) {
  const [hourlyRate, setHourlyRate] = useState<number | null>(employee?.hourly_rate ?? null)
  const [monthlySalary, setMonthlySalary] = useState<number | null>(employee?.monthly_salary ?? null)
  const [taxClass, setTaxClass] = useState(employee?.tax_class ?? "")

  const handleTaxClassChange = (v: string | null) => { setTaxClass(v ?? "") }

  const hourlyTotal = hourlyRate ? hourlyRate * (1 + AG_ANTEIL_PROZENT) : null
  const monthlyTotal = monthlySalary ? monthlySalary * (1 + AG_ANTEIL_PROZENT) : null
  const effectiveHourlyRate = monthlyTotal ? monthlyTotal / 169 : null

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">Vergütung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hourly_rate">Stundenlohn (EUR)</Label>
            <CurrencyInput name="hourly_rate" defaultValue={employee?.hourly_rate} placeholder="16,00" onValueChange={setHourlyRate} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="monthly_salary">Monatsgehalt (EUR)</Label>
            <CurrencyInput name="monthly_salary" defaultValue={employee?.monthly_salary} placeholder="2.500,00" onValueChange={setMonthlySalary} />
          </div>
        </div>

        {(hourlyTotal || monthlyTotal) && (
          <div className="rounded-xl bg-muted border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Arbeitgeberkostenrechner (AG-Anteil ~22,5%)
            </p>
            {hourlyTotal && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gesamtkosten / Stunde</span>
                <span className="font-semibold text-foreground">{formatCurrency(hourlyTotal)}</span>
              </div>
            )}
            {monthlyTotal && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gesamtkosten / Monat</span>
                <span className="font-semibold text-foreground">{formatCurrency(monthlyTotal)}</span>
              </div>
            )}
            {effectiveHourlyRate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Effektiver Stundensatz</span>
                <span className="font-semibold text-primary">{formatCurrency(effectiveHourlyRate)}</span>
              </div>
            )}
          </div>
        )}

        {mode === "edit" && (
          <>
            <Separator />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="tax_class">Steuerklasse</Label>
                  <Tooltip>
                    <TooltipTrigger type="button">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Die Lohnsteuerklasse bestimmt den Steuerabzug.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={taxClass} onValueChange={handleTaxClassChange}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Klasse auswählen">
                      {(value) => (value ? `Klasse ${value}` : "Klasse auswählen")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_CLASS_OPTIONS.map((tc) => (
                      <SelectItem key={tc} value={tc}>Klasse {tc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="social_security_number">Sozialversicherungsnr.</Label>
                  <Tooltip>
                    <TooltipTrigger type="button">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Die 12-stellige Sozialversicherungsnummer.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input id="social_security_number" name="social_security_number" defaultValue={employee?.social_security_number ?? ""} placeholder="65 270645 S 001" className="h-11 rounded-xl font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="health_insurance">Krankenkasse</Label>
                <Input id="health_insurance" name="health_insurance" defaultValue={employee?.health_insurance ?? ""} placeholder="AOK Bayern" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="iban">IBAN</Label>
                  <Tooltip>
                    <TooltipTrigger type="button">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Für die Gehaltsüberweisung.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input id="iban" name="iban" defaultValue={employee?.iban ?? ""} placeholder="DE89 3704 0044 0532 0130 00" className="h-11 rounded-xl font-mono" />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
