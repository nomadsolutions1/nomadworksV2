"use client"

import { PageHeader } from "@/components/layout/page-header"
import { ProfileForm } from "@/components/modules/settings/profile-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { ROLES } from "@/lib/utils/constants"

const LANGUAGE_LABELS: Record<string, string> = {
  de: "Deutsch",
  en: "English",
  pl: "Polski",
  ro: "Română",
  tr: "Türkçe",
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: "Urlaub",
  sick: "Krank",
  special: "Sonderurlaub",
  unpaid: "Unbezahlt",
}

const LEAVE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Ausstehend", color: "#f59e0b" },
  approved: { label: "Genehmigt", color: "#10b981" },
  rejected: { label: "Abgelehnt", color: "#ef4444" },
}

import type { UserProfile } from "@/lib/actions/profile"

interface LeaveItem {
  id: string
  type: string
  start_date: string
  end_date: string
  days: number
  status: string
}

interface ProfileContentProps {
  profile: UserProfile | null
  leaves: LeaveItem[]
}

export function ProfileContent({ profile, leaves }: ProfileContentProps) {
  return (
    <div className="space-y-6">
      <PageHeader title="Mein Profil" description="Verwalten Sie Ihre persönlichen Daten." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-2 space-y-6">
          {profile ? (
            <ProfileForm profile={profile} />
          ) : (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Profil konnte nicht geladen werden.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          {/* Account info */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Konto-Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Firma", value: profile?.company_name ?? "\u2014" },
                {
                  label: "Rolle",
                  value: profile ? (ROLES[profile.role as keyof typeof ROLES] ?? profile.role) : "\u2014",
                },
                {
                  label: "Sprache",
                  value: profile?.language ? (LANGUAGE_LABELS[profile.language] ?? profile.language) : "Deutsch",
                },
                {
                  label: "Urlaubstage",
                  value: profile?.annual_leave_days ? `${profile.annual_leave_days} Tage/Jahr` : "\u2014",
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-medium text-foreground">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leave requests */}
      {leaves.length > 0 && (
        <Card className="rounded-2xl shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Meine Urlaubsanträge
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {["Typ", "Von", "Bis", "Tage", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => {
                    const statusInfo = LEAVE_STATUS_LABELS[leave.status ?? "pending"]
                    return (
                      <tr key={leave.id} className="border-b hover:bg-muted/50 even:bg-[#fafbfc]">
                        <td className="px-4 py-3 text-sm">
                          {LEAVE_TYPE_LABELS[leave.type ?? "vacation"] ?? leave.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground/80">
                          {formatDate(leave.start_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground/80">
                          {formatDate(leave.end_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground/80">
                          {leave.days} Tage
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-medium px-2 py-1 rounded-lg"
                            style={{
                              backgroundColor: `${statusInfo?.color ?? "#64748b"}15`,
                              color: statusInfo?.color ?? "#64748b",
                            }}
                          >
                            {statusInfo?.label ?? leave.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
