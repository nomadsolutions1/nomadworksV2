import { getEmployees, getEmployeeStats } from "@/lib/actions/employees"
import { EmployeeList } from "@/components/modules/employees/employee-list"
import { TipsBanner } from "@/components/shared/tips-banner"
import { getAuthContext, checkModuleAccess } from "@/lib/utils/auth-helper"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Mitarbeiter" }

export default async function MitarbeiterPage() {
  const [stats, employeesResult, authCtx] = await Promise.all([
    getEmployeeStats(),
    getEmployees(),
    getAuthContext(),
  ])

  const canEdit = authCtx.profile
    ? authCtx.profile.role === "owner" ||
      (await checkModuleAccess(authCtx.profile, "mitarbeiter", "write", authCtx.db))
    : false

  // Spread each employee to ensure plain serializable objects
  const employees = (employeesResult.data ?? []).map((e) => ({ ...e }))

  return (
    <>
      <TipsBanner module="mitarbeiter" />
      <EmployeeList employees={employees} stats={stats} canEdit={canEdit} />
    </>
  )
}
