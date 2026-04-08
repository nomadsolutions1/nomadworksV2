import { getProfile, getLeaveRequests } from "@/lib/actions/profile"
import { ProfileContent } from "@/components/modules/profile/profile-content"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Mein Profil" }

export default async function ProfilPage() {
  const [profileRes, leaveRes] = await Promise.all([
    getProfile(),
    getLeaveRequests(),
  ])

  const profile = profileRes.data
  const rawLeaves = leaveRes.data ?? []
  const leaves = rawLeaves.map((leave) => ({
    id: leave.id as string,
    type: (leave.type as string) ?? "vacation",
    start_date: leave.start_date as string,
    end_date: leave.end_date as string,
    days: leave.days as number,
    status: (leave.status as string) ?? "pending",
  }))

  return <ProfileContent profile={profile} leaves={leaves} />
}
