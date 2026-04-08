"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { Check, CreditCard, ExternalLink, Loader2, Crown } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import { createCheckoutSession, createPortalSession } from "@/lib/actions/billing"
import type { SubscriptionStatus } from "@/lib/actions/billing"
import { toast } from "sonner"

interface BillingTabProps {
  subscription: SubscriptionStatus | null
  currentPlan: string
}

const PLANS = [
  {
    key: "starter" as const,
    name: "Starter",
    price: 149.99,
    maxEmployees: 10,
    popular: false,
    features: [
      "Bis zu 10 Mitarbeiter",
      "Stempeluhr & Zeiterfassung",
      "Baustellen-Verwaltung",
      "Disposition",
      "Grundlegende Berichte",
    ],
  },
  {
    key: "business" as const,
    name: "Business",
    price: 249.99,
    maxEmployees: 30,
    popular: true,
    features: [
      "Bis zu 30 Mitarbeiter",
      "Alles aus Starter",
      "Fuhrpark-Verwaltung",
      "Lager & Einkauf",
      "Rechnungswesen",
      "Subunternehmer",
      "Bautagesberichte",
    ],
  },
  {
    key: "enterprise" as const,
    name: "Enterprise",
    price: 499.99,
    maxEmployees: 100,
    popular: false,
    features: [
      "Bis zu 100 Mitarbeiter",
      "Alles aus Business",
      "Erweiterte Berichte & Export",
      "Prioritäts-Support",
      "Individuelle Anpassungen",
    ],
  },
]

function StatusLabel({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <StatusBadge label="Aktiv" variant="success" />
    case "trialing":
      return <StatusBadge label="Testphase" variant="warning" />
    case "past_due":
      return <StatusBadge label="Zahlung überfällig" variant="danger" />
    case "canceled":
      return <StatusBadge label="Gekündigt" variant="neutral" />
    default:
      return <StatusBadge label={status} variant="neutral" />
  }
}

export function BillingTab({ subscription, currentPlan }: BillingTabProps) {
  const [isPending, startTransition] = useTransition()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  function handleUpgrade(plan: "starter" | "business" | "enterprise") {
    setLoadingPlan(plan)
    startTransition(async () => {
      const result = await createCheckoutSession(plan)
      if (result.error) {
        toast.error(result.error)
        setLoadingPlan(null)
        return
      }
      if (result.url) {
        window.location.href = result.url
      }
    })
  }

  function handlePortal() {
    startTransition(async () => {
      const result = await createPortalSession()
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.url) {
        window.location.href = result.url
      }
    })
  }

  const isTrial = currentPlan === "trial"
  // hasStripeSubscription: true only when there's a real Stripe subscription (currentPeriodEnd set)
  // Admin-created plans have status "active" but no currentPeriodEnd
  const hasStripeSubscription = !isTrial && subscription?.status === "active" && subscription?.currentPeriodEnd !== null
  const isAdminPlan = !isTrial && !hasStripeSubscription

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      {subscription && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Aktueller Plan</CardTitle>
              <StatusLabel status={subscription.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTrial && subscription.trialDaysLeft !== null && (
              <div className={`rounded-xl p-4 ${
                subscription.trialDaysLeft <= 2
                  ? "bg-danger/10 border border-danger/30"
                  : "bg-accent/10 border border-accent/30"
              }`}>
                <p className={`text-sm font-semibold ${
                  subscription.trialDaysLeft <= 2 ? "text-danger/80" : "text-accent-foreground"
                }`}>
                  {subscription.trialDaysLeft === 0
                    ? "Ihre Testphase ist abgelaufen"
                    : `Noch ${subscription.trialDaysLeft} ${subscription.trialDaysLeft === 1 ? "Tag" : "Tage"} in der Testphase`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Wählen Sie einen Plan um alle Features weiterhin nutzen zu können.
                </p>
              </div>
            )}

            {isAdminPlan && (
              <div className="rounded-xl border border-muted-foreground/20 bg-muted/50 p-4">
                <p className="font-semibold text-foreground text-lg capitalize">Ihr Plan: {currentPlan}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Verwaltet durch Nomad Solutions. Wählen Sie unten einen Plan um die Abrechnung über Stripe zu aktivieren.
                </p>
              </div>
            )}

            {hasStripeSubscription && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-semibold text-primary text-lg capitalize">{currentPlan}</p>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Nächste Abrechnung: {new Date(subscription.currentPeriodEnd).toLocaleDateString("de-DE")}
                  </p>
                )}
                {subscription.cancelAtPeriodEnd && (
                  <p className="text-sm text-danger mt-1 font-medium">
                    Wird zum Ende der Laufzeit gekündigt
                  </p>
                )}
              </div>
            )}

            {hasStripeSubscription && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={handlePortal}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  Plan ändern
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={handlePortal}
                  disabled={isPending}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Rechnungen einsehen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Cards — show for trial and admin-created plans (no Stripe yet) */}
      {(isTrial || isAdminPlan) && (
        <>
          <h2 className="text-lg font-semibold text-foreground">Plan wählen</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {PLANS.map((plan, index) => {
              const isCurrent = currentPlan === plan.key
              const currentIndex = PLANS.findIndex((p) => p.key === currentPlan)
              const isDowngrade = currentIndex >= 0 && index < currentIndex
              return (
                <Card
                  key={plan.key}
                  className={`rounded-2xl shadow-sm relative overflow-visible ${
                    plan.popular
                      ? "border-2 border-primary shadow-md mt-3"
                      : isCurrent
                        ? "border-2 border-success"
                        : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center gap-1 bg-accent text-white rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                        <Crown className="h-3 w-3" />
                        Beliebtester Plan
                      </span>
                    </div>
                  )}
                  <CardHeader className="pb-2 pt-6">
                    <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold font-mono text-foreground">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">/Monat</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      bis zu {plan.maxEmployees} Mitarbeiter
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-foreground/80">
                          <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Button disabled className="w-full rounded-xl">
                        Aktueller Plan
                      </Button>
                    ) : (
                      <Button
                        className={`w-full rounded-xl font-semibold ${
                          plan.popular
                            ? "bg-primary hover:bg-primary/80 text-white"
                            : "bg-muted/50 hover:bg-muted text-primary border border-primary/20"
                        }`}
                        onClick={() => handleUpgrade(plan.key)}
                        disabled={isPending}
                      >
                        {isPending && loadingPlan === plan.key ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {isDowngrade ? "Downgraden" : "Jetzt upgraden"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Managed plan cards for Stripe subscribers */}
      {hasStripeSubscription && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Verfügbare Pläne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.key
              return (
                <div
                  key={plan.key}
                  className={`flex items-center justify-between rounded-xl p-3 border ${
                    isCurrent ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">bis {plan.maxEmployees} MA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(plan.price)}/Mo.
                    </p>
                    {isCurrent && (
                      <span className="text-xs text-primary font-medium">Aktuell</span>
                    )}
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-muted-foreground mt-2">
              Planwechsel über &quot;Plan ändern&quot; oben möglich.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
