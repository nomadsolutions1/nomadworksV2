import { getNotifications } from "@/lib/actions/notifications"
import { PageHeader } from "@/components/layout/page-header"
import { NotificationList } from "@/components/modules/notifications/notification-list"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Benachrichtigungen" }

export default async function BenachrichtigungenPage() {
  const { data: notifications } = await getNotifications()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Benachrichtigungen"
        description="Alle Warnungen und Hinweise im Überblick."
      />
      <NotificationList notifications={notifications ?? []} />
    </div>
  )
}
