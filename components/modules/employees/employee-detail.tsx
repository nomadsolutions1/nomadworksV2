"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmployeeForm } from "@/components/modules/employees/employee-form"
import { QualificationList } from "@/components/modules/employees/qualification-list"
import { LeaveSection } from "@/components/modules/employees/leave-section"
import { ForemanPermissions } from "@/components/modules/employees/foreman-permissions"
import { ResetPasswordDialog } from "@/components/modules/employees/reset-password-dialog"
import { WageCalculatorCard } from "@/components/modules/employees/wage-calculator-card"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { User, CalendarDays, Award, Shield } from "lucide-react"
import { ROLE_LABELS, contractLabel } from "@/lib/utils/constants"
import type { Employee, Qualification, LeaveRequest, SickDay, ForemanPermission } from "@/lib/actions/employees"

interface EmployeeDetailProps {
  employee: Employee
  qualifications: Qualification[]
  leaveRequests: LeaveRequest[]
  sickDays: SickDay[]
  userId: string
  viewerRole?: string
  foremanPermissions?: ForemanPermission[]
  canViewSensitiveData?: boolean
}

export function EmployeeDetail({
  employee,
  qualifications,
  leaveRequests,
  sickDays,
  userId,
  viewerRole,
  foremanPermissions,
  canViewSensitiveData,
}: EmployeeDetailProps) {
  const fullName = `${employee.first_name} ${employee.last_name}`

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Mitarbeiter", href: "/mitarbeiter" }, { label: fullName }]} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-semibold text-lg">
            {employee.first_name[0]}
            {employee.last_name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-semibold font-heading text-foreground">{fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {ROLE_LABELS[employee.role] ?? employee.role}
              </span>
              {employee.phone && (
                <>
                  <span className="text-border">·</span>
                  <a href={`tel:${employee.phone}`} className="text-sm text-muted-foreground hover:text-primary">
                    {employee.phone}
                  </a>
                </>
              )}
              {employee.has_account ? (
                <StatusBadge label="Account aktiv" variant="success" />
              ) : (
                <StatusBadge label="Kein Account" variant="neutral" />
              )}
            </div>
          </div>
        </div>
        {employee.has_account &&
          (viewerRole === "owner" || viewerRole === "foreman" || viewerRole === "office") && (
            <ResetPasswordDialog employeeId={employee.id} employeeName={fullName} />
          )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stammdaten">
        <TabsList className="mb-6">
          <TabsTrigger value="stammdaten" className="rounded-lg flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Stammdaten
          </TabsTrigger>
          <TabsTrigger value="qualifikationen" className="rounded-lg flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            Qualifikationen
            {qualifications.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {qualifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="urlaub" className="rounded-lg flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Urlaub & Krankheit
          </TabsTrigger>
          {(employee.role === "foreman" || employee.role === "office") &&
            (viewerRole === "owner" || viewerRole === "super_admin") && (
              <TabsTrigger value="berechtigungen" className="rounded-lg flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Berechtigungen
              </TabsTrigger>
            )}
        </TabsList>

        <TabsContent value="stammdaten" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Übersicht</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vertragsart</span>
                    <span className="font-medium">{contractLabel(employee.contract_type)}</span>
                  </div>
                  {employee.contract_start && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vertragsbeginn</span>
                      <span className="font-medium">{formatDate(employee.contract_start)}</span>
                    </div>
                  )}
                  {employee.birth_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Geburtsdatum</span>
                      <span className="font-medium">{formatDate(employee.birth_date)}</span>
                    </div>
                  )}
                  {employee.nationality && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nationalität</span>
                      <span className="font-medium">{employee.nationality}</span>
                    </div>
                  )}
                  {employee.annual_leave_days && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Urlaubstage / Jahr</span>
                      <span className="font-medium">{employee.annual_leave_days}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Im System seit</span>
                    <span className="font-medium">{formatDate(employee.created_at)}</span>
                  </div>
                </CardContent>
              </Card>

              {employee.emergency_contact_name && (
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-foreground">Notfallkontakt</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-medium">{employee.emergency_contact_name}</p>
                    {employee.emergency_contact_relation && (
                      <p className="text-xs text-muted-foreground">{employee.emergency_contact_relation}</p>
                    )}
                    {employee.emergency_contact_phone && (
                      <a href={`tel:${employee.emergency_contact_phone}`} className="text-sm text-primary hover:underline block">
                        {employee.emergency_contact_phone}
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              <WageCalculatorCard hourlyRate={employee.hourly_rate} monthlySalary={employee.monthly_salary} />
            </div>

            <div className="lg:col-span-2">
              <EmployeeForm employee={employee} mode="edit" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="qualifikationen" className="mt-0">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <QualificationList userId={userId} qualifications={qualifications} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urlaub" className="mt-0">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <LeaveSection userId={userId} leaveRequests={leaveRequests} sickDays={sickDays} />
            </CardContent>
          </Card>
        </TabsContent>

        {(employee.role === "foreman" || employee.role === "office") &&
          (viewerRole === "owner" || viewerRole === "super_admin") && (
            <TabsContent value="berechtigungen" className="mt-0">
              <ForemanPermissions
                foremanId={userId}
                permissions={foremanPermissions ?? []}
                canViewSensitiveData={canViewSensitiveData ?? false}
              />
            </TabsContent>
          )}
      </Tabs>
    </div>
  )
}
