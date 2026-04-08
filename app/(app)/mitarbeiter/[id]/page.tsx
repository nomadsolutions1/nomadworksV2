import { notFound } from "next/navigation"
import {
  getEmployee,
  getQualifications,
  getLeaveRequests,
  getSickDays,
  getForemanModulePermissions,
} from "@/lib/actions/employees"
import { EmployeeDetail } from "@/components/modules/employees/employee-detail"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getEmployee(id)
  if (!data) return { title: "Mitarbeiter nicht gefunden" }
  return { title: `${data.first_name} ${data.last_name}` }
}

export default async function MitarbeiterDetailPage({ params }: Props) {
  const { id } = await params

  // Get viewer's role
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let viewerRole = "worker"
  if (user) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role, can_view_sensitive_data")
      .eq("id", user.id)
      .single()
    viewerRole = viewerProfile?.role ?? "worker"
  }

  const [employeeResult, qualsResult, leaveResult, sickResult] =
    await Promise.all([
      getEmployee(id),
      getQualifications(id),
      getLeaveRequests(id),
      getSickDays(id),
    ])

  if (!employeeResult.data) notFound()

  // Fetch foreman permissions if viewing a foreman and viewer is owner
  let foremanPermissions = undefined
  let canViewSensitiveData = false
  if (
    (employeeResult.data.role === "foreman" ||
      employeeResult.data.role === "office") &&
    (viewerRole === "owner" || viewerRole === "super_admin")
  ) {
    const permResult = await getForemanModulePermissions(id)
    foremanPermissions = permResult.data ?? []

    const { data: foremanProfile } = await supabase
      .from("profiles")
      .select("can_view_sensitive_data")
      .eq("id", id)
      .single()
    canViewSensitiveData = foremanProfile?.can_view_sensitive_data ?? false
  }

  return (
    <EmployeeDetail
      employee={employeeResult.data}
      qualifications={qualsResult.data ?? []}
      leaveRequests={leaveResult.data ?? []}
      sickDays={sickResult.data ?? []}
      userId={id}
      viewerRole={viewerRole}
      foremanPermissions={foremanPermissions}
      canViewSensitiveData={canViewSensitiveData}
    />
  )
}
