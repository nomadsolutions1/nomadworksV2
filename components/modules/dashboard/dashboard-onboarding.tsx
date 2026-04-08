"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Rocket,
  Building2,
  UserPlus,
  HardHat,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import type { OnboardingStatus } from "@/lib/actions/dashboard"

interface DashboardOnboardingProps {
  onboarding: OnboardingStatus
  showFullEmpty: boolean
}

const ICON_MAP = {
  Building2,
  UserPlus,
  HardHat,
  ClipboardList,
} as const

export function DashboardOnboarding({
  onboarding,
  showFullEmpty,
}: DashboardOnboardingProps) {
  if (showFullEmpty) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl shadow-sm border-primary/10 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03]">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Rocket className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold font-heading text-foreground mb-2">
              Willkommen bei NomadWorks!
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Starten Sie in wenigen Schritten. Richten Sie Ihr Unternehmen
              ein, laden Sie Ihr Team ein und verwalten Sie Ihre Baustellen
              digital.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SetupCard
            icon="Building2"
            title="Firmendaten vervollstaendigen"
            description="Adresse, Bankdaten und Logo hinterlegen"
            href="/firma"
            done={onboarding.companyDataComplete}
            step={1}
          />
          <SetupCard
            icon="UserPlus"
            title="Ersten Mitarbeiter einladen"
            description="Laden Sie Ihr Team per E-Mail oder Link ein"
            href="/mitarbeiter"
            done={onboarding.hasEmployees}
            step={2}
          />
          <SetupCard
            icon="HardHat"
            title="Erste Baustelle anlegen"
            description="Erstellen Sie Ihre erste Baustelle"
            href="/baustellen"
            done={onboarding.hasSites}
            step={3}
          />
          <SetupCard
            icon="ClipboardList"
            title="Ersten Auftrag erstellen"
            description="Erfassen Sie Ihren ersten Auftrag"
            href="/auftraege"
            done={onboarding.hasOrders}
            step={4}
          />
        </div>
      </div>
    )
  }

  if (onboarding.allComplete) return null

  return (
    <Card className="rounded-2xl shadow-sm border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold font-heading">
            Einrichtung abschliessen
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {
              [
                onboarding.companyDataComplete,
                onboarding.hasEmployees,
                onboarding.hasSites,
                onboarding.hasOrders,
                onboarding.hasInvoices,
              ].filter(Boolean).length
            }{" "}
            von 5
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <OnboardingItem
            done={onboarding.companyDataComplete}
            label="Firmendaten vervollstaendigen"
            href="/firma"
          />
          <OnboardingItem
            done={onboarding.hasEmployees}
            label="Ersten Mitarbeiter einladen"
            href="/mitarbeiter"
          />
          <OnboardingItem
            done={onboarding.hasSites}
            label="Erste Baustelle anlegen"
            href="/baustellen"
          />
          <OnboardingItem
            done={onboarding.hasOrders}
            label="Ersten Auftrag erstellen"
            href="/auftraege"
          />
          <OnboardingItem
            done={onboarding.hasInvoices}
            label="Erste Rechnung erstellen"
            href="/rechnungen"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SetupCard({
  icon,
  title,
  description,
  href,
  done,
  step,
}: {
  icon: keyof typeof ICON_MAP
  title: string
  description: string
  href: string
  done: boolean
  step: number
}) {
  const Icon = ICON_MAP[icon]
  return (
    <Link href={href} aria-label={`${title} ${done ? "(erledigt)" : ""}`}>
      <Card
        className={`rounded-2xl shadow-sm hover:shadow-md transition-all group cursor-pointer ${
          done
            ? "border-success/30 bg-success/5"
            : "hover:-translate-y-0.5"
        }`}
      >
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              done ? "bg-success/10" : "bg-primary/10"
            }`}
          >
            {done ? (
              <CheckCircle2 className="h-6 w-6 text-success" />
            ) : (
              <Icon className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {!done && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {step}
                </span>
              )}
              <p
                className={`text-sm font-semibold ${
                  done ? "text-success" : "text-foreground"
                }`}
              >
                {title}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          </div>
          {!done && (
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

function OnboardingItem({
  done,
  label,
  href,
}: {
  done: boolean
  label: string
  href: string
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        done ? "opacity-60" : "hover:bg-muted"
      }`}
      aria-label={`${label} ${done ? "(erledigt)" : ""}`}
    >
      {done ? (
        <CheckCircle2 className="h-4.5 w-4.5 text-success shrink-0" />
      ) : (
        <div className="h-4.5 w-4.5 rounded-full border-2 border-border shrink-0" />
      )}
      <span
        className={`text-sm ${
          done
            ? "text-muted-foreground line-through"
            : "text-foreground font-medium"
        }`}
      >
        {label}
      </span>
      {!done && (
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
      )}
    </Link>
  )
}
