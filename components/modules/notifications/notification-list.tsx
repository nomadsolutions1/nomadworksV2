"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { markAsRead, markAllAsRead } from "@/lib/actions/notifications"
import { AlertCircle, AlertTriangle, Info, CheckCheck, ExternalLink } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils/format"
import Link from "next/link"
import type { Notification } from "@/lib/actions/notifications"

interface NotificationListProps {
  notifications: Notification[]
}

const severityConfig = {
  critical: {
    label: "Kritisch",
    icon: AlertCircle,
    cardClass: "border-danger/30 bg-danger/5",
    iconClass: "text-danger",
    badgeClass: "bg-danger/10 text-danger",
  },
  warning: {
    label: "Warnung",
    icon: AlertTriangle,
    cardClass: "border-accent/30 bg-accent/5",
    iconClass: "text-accent",
    badgeClass: "bg-accent/10 text-accent",
  },
  info: {
    label: "Hinweis",
    icon: Info,
    cardClass: "border-blue-500/30 bg-blue-500/5",
    iconClass: "text-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-500",
  },
}

export function NotificationList({ notifications: initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [loading, setLoading] = useState(false)

  async function handleMarkAsRead(id: string) {
    const result = await markAsRead(id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    )
  }

  async function handleMarkAllAsRead() {
    setLoading(true)
    const result = await markAllAsRead()
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    const now = new Date().toISOString()
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })))
    toast.success("Alle als gelesen markiert")
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length

  // Group by severity
  const grouped = {
    critical: notifications.filter((n) => n.severity === "critical"),
    warning: notifications.filter((n) => n.severity === "warning"),
    info: notifications.filter((n) => n.severity === "info"),
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-2xl bg-muted p-4 mb-4">
          <CheckCheck className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Keine Benachrichtigungen</h3>
        <p className="text-sm text-muted-foreground">Alle Systeme laufen einwandfrei.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{unreadCount} ungelesen</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={handleMarkAllAsRead}
            disabled={loading}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Alle als gelesen markieren
          </Button>
        </div>
      )}

      {/* Grouped sections */}
      {(["critical", "warning", "info"] as const).map((severity) => {
        const group = grouped[severity]
        if (group.length === 0) return null

        const config = severityConfig[severity]

        return (
          <div key={severity}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-foreground">{config.label}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badgeClass}`}>
                {group.length}
              </span>
            </div>

            <div className="space-y-2">
              {group.map((notification) => {
                const Icon = config.icon
                const isRead = !!notification.read_at

                return (
                  <Card
                    key={notification.id}
                    className={`rounded-2xl shadow-sm border ${config.cardClass} ${isRead ? "opacity-60" : ""}`}
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${config.iconClass}`} />
                      <div className="flex-1 min-w-0">
                        {notification.title && (
                          <p className="text-sm font-medium text-foreground">{notification.title}</p>
                        )}
                        <p className={`text-sm text-foreground/80 ${notification.title ? "mt-0.5" : ""}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {notification.link && (
                          <Link href={notification.link}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-lg text-xs px-2"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Gelesen
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
