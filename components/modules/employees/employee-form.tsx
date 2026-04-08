"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { HelpCircle, Loader2 } from "lucide-react"
import { createEmployee, updateEmployee } from "@/lib/actions/employees"
import { formatCurrency } from "@/lib/utils/format"
import { ROLE_LABELS, AG_ANTEIL_PROZENT } from "@/lib/utils/constants"
import { EmployeeFormWageSection } from "@/components/modules/employees/employee-form-wage"
import { EmployeeFormAccountSection } from "@/components/modules/employees/employee-form-account"
import type { Employee } from "@/lib/actions/employees"

interface EmployeeFormProps {
  employee?: Employee
  mode: "create" | "edit"
}

const ROLE_OPTIONS = [
  { value: "worker", label: ROLE_LABELS.worker },
  { value: "foreman", label: ROLE_LABELS.foreman },
  { value: "office", label: ROLE_LABELS.office },
  { value: "accountant", label: ROLE_LABELS.accountant },
  { value: "owner", label: ROLE_LABELS.owner },
  { value: "employee", label: ROLE_LABELS.employee },
]

const CONTRACT_OPTIONS = [
  { value: "permanent", label: "Vollzeit" },
  { value: "parttime", label: "Teilzeit" },
  { value: "minijob", label: "Minijob" },
  { value: "temporary", label: "Zeitarbeiter" },
  { value: "intern", label: "Praktikant" },
]

const NOTICE_PERIOD_OPTIONS = [
  { value: "2_weeks", label: "2 Wochen" },
  { value: "4_weeks", label: "4 Wochen" },
  { value: "1_month", label: "1 Monat" },
  { value: "2_months", label: "2 Monate" },
  { value: "3_months", label: "3 Monate" },
  { value: "6_months", label: "6 Monate" },
]

export function EmployeeForm({ employee, mode }: EmployeeFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [role, setRole] = useState(employee?.role ?? "worker")
  const [contractType, setContractType] = useState(employee?.contract_type ?? "")
  const [noticePeriod, setNoticePeriod] = useState(employee?.notice_period ?? "")
  const [withAccount, setWithAccount] = useState(false)

  const handleRoleChange = (v: string | null) => { if (v) setRole(v) }
  const handleContractChange = (v: string | null) => { setContractType(v ?? "") }
  const handleNoticePeriodChange = (v: string | null) => { setNoticePeriod(v ?? "") }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("role", role)
    formData.set("contract_type", contractType)
    if (noticePeriod) formData.set("notice_period", noticePeriod)
    if (mode === "create") formData.set("with_account", withAccount ? "true" : "false")

    startTransition(async () => {
      if (mode === "create") {
        const result = await createEmployee(formData)
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : Object.values(result.error).flat().join(", ")
          toast.error(msg)
        } else if (result.success) {
          toast.success("Mitarbeiter erfolgreich angelegt")
          router.push("/mitarbeiter")
        }
      } else if (employee) {
        const result = await updateEmployee(employee.id, formData)
        if (result.error) {
          const msg = typeof result.error === "string" ? result.error : Object.values(result.error).flat().join(", ")
          toast.error(msg)
        } else if (result.success) {
          toast.success("Mitarbeiter erfolgreich aktualisiert")
          router.refresh()
        }
      }
    })
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Data */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Persoenliche Daten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">Vorname *</Label>
                <Input id="first_name" name="first_name" defaultValue={employee?.first_name ?? ""} placeholder="Max" className="h-11 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Nachname *</Label>
                <Input id="last_name" name="last_name" defaultValue={employee?.last_name ?? ""} placeholder="Mustermann" className="h-11 rounded-xl" required />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="role">Rolle *</Label>
                <Select value={role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Rolle auswaehlen">
                      {(value) => ROLE_OPTIONS.find((o) => o.value === value)?.label ?? "Rolle auswaehlen"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={employee?.phone ?? ""} placeholder="+49 170 1234567" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job_title">Berufsbezeichnung</Label>
                <Input id="job_title" name="job_title" defaultValue={employee?.job_title ?? ""} placeholder="z.B. Baufacharbeiter" className="h-11 rounded-xl" list="job-title-suggestions" />
                <datalist id="job-title-suggestions">
                  <option value="Baufacharbeiter" />
                  <option value="Bauhelfer" />
                  <option value="Maschinist" />
                  <option value="LKW-Fahrer" />
                  <option value="Vorarbeiter" />
                  <option value="Polier" />
                </datalist>
              </div>
            </div>
            {mode === "edit" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="birth_date">Geburtsdatum</Label>
                  <Input id="birth_date" name="birth_date" type="date" defaultValue={employee?.birth_date ?? ""} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nationality">Nationalitaet</Label>
                  <Input id="nationality" name="nationality" defaultValue={employee?.nationality ?? ""} placeholder="Deutsch" className="h-11 rounded-xl" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Vertragsdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Vertragsart</Label>
                <Select value={contractType} onValueChange={handleContractChange}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Vertragsart auswaehlen">
                      {(value) => CONTRACT_OPTIONS.find((o) => o.value === value)?.label ?? "Vertragsart auswaehlen"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contract_start">Vertragsbeginn</Label>
                <Input id="contract_start" name="contract_start" type="date" defaultValue={employee?.contract_start ?? ""} className="h-11 rounded-xl" />
              </div>
            </div>
            {mode === "edit" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Kuendigungsfrist</Label>
                    <Select value={noticePeriod} onValueChange={handleNoticePeriodChange}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Frist auswaehlen">
                          {(value) => NOTICE_PERIOD_OPTIONS.find((o) => o.value === value)?.label ?? "Frist auswaehlen"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {NOTICE_PERIOD_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="probation_end">Probezeit bis</Label>
                    <Input id="probation_end" name="probation_end" type="date" defaultValue={employee?.probation_end ?? ""} className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="annual_leave_days">Urlaubstage pro Jahr</Label>
                  <Input id="annual_leave_days" name="annual_leave_days" type="number" min={0} max={365} defaultValue={employee?.annual_leave_days ?? 30} className="h-11 rounded-xl" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Wage */}
        <EmployeeFormWageSection employee={employee} mode={mode} />

        {/* Emergency Contact (edit only) */}
        {mode === "edit" && (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Notfallkontakt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_name">Name</Label>
                  <Input id="emergency_contact_name" name="emergency_contact_name" defaultValue={employee?.emergency_contact_name ?? ""} placeholder="Maria Mustermann" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_phone">Telefon</Label>
                  <Input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" defaultValue={employee?.emergency_contact_phone ?? ""} placeholder="+49 170 9876543" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_relation">Beziehung</Label>
                  <Input id="emergency_contact_relation" name="emergency_contact_relation" defaultValue={employee?.emergency_contact_relation ?? ""} placeholder="Ehefrau / Mutter / Bruder" className="h-11 rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account invite (create only) */}
        {mode === "create" && role !== "employee" && (
          <EmployeeFormAccountSection withAccount={withAccount} setWithAccount={setWithAccount} />
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.back()} disabled={isPending}>
            Abbrechen
          </Button>
          <Button type="submit" className="rounded-xl font-semibold" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "create" ? "Mitarbeiter anlegen" : "Aenderungen speichern"}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  )
}
