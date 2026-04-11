"use server"

import { z } from "zod"
import { getStripe, getPlanPriceMap } from "@/lib/services/stripe"
import { withAuth } from "@/lib/utils/auth-helper"
import { logActivity } from "@/lib/utils/activity-logger"
import { trackError } from "@/lib/utils/error-tracker"

// ─── Types ───────────────────────────────────────────────────

export type SubscriptionStatus = {
  plan: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  trialDaysLeft: number | null
}

const planSchema = z.enum(["starter", "business", "enterprise"])

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://nomadworks.vercel.app"
}

// ─── createCheckoutSession ───────────────────────────────────

export async function createCheckoutSession(
  plan: "starter" | "business" | "enterprise"
): Promise<{ url?: string; error?: string }> {
  const result = await withAuth("firma", "write", async ({ user, profile, db }) => {
    // Only the owner may upgrade — "firma" module-check already enforces this
    // (only owner has firma permissions) but we double-check here (Defense in Depth).
    if (profile.role !== "owner") {
      return { error: "Nur der Geschäftsführer kann den Plan ändern" }
    }

    const validated = planSchema.safeParse(plan)
    if (!validated.success) {
      return { error: "Ungültiger Plan" }
    }

    const priceId = getPlanPriceMap()[validated.data]
    if (!priceId) {
      trackError("billing", "createCheckoutSession", "Missing STRIPE_PRICE_* env var", { plan: validated.data })
      return { error: "Dieser Plan ist aktuell nicht verfügbar." }
    }

    const { data: company, error: companyErr } = await db
      .from("companies")
      .select("id, name, stripe_customer_id")
      .eq("id", profile.company_id)
      .single()

    if (companyErr || !company) {
      trackError("billing", "createCheckoutSession", companyErr?.message || "Company not found", { companyId: profile.company_id })
      return { error: "Firma nicht gefunden" }
    }

    try {
      // Create or reuse Stripe customer
      let customerId: string | null = company.stripe_customer_id
      if (!customerId) {
        const customer = await getStripe().customers.create({
          email: user.email,
          name: company.name,
          metadata: {
            company_id: company.id,
            nomadworks_plan: validated.data,
          },
        })
        customerId = customer.id

        await db
          .from("companies")
          .update({ stripe_customer_id: customerId })
          .eq("id", company.id)
      }

      const appUrl = getAppUrl()

      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/firma?billing=success`,
        cancel_url: `${appUrl}/firma?billing=cancelled`,
        allow_promotion_codes: true,
        billing_address_collection: "required",
        metadata: {
          company_id: company.id,
          plan: validated.data,
        },
        subscription_data: {
          metadata: {
            company_id: company.id,
            plan: validated.data,
          },
        },
      })

      await logActivity({
        companyId: profile.company_id,
        userId: user.id,
        action: "checkout_started",
        entityType: "billing",
        entityId: company.id,
        title: `Checkout gestartet: ${validated.data}`,
      })

      return { url: session.url ?? undefined }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler"
      trackError("billing", "createCheckoutSession", msg, { companyId: profile.company_id, plan: validated.data })
      return { error: "Checkout konnte nicht erstellt werden. Bitte versuchen Sie es erneut." }
    }
  })

  if ("error" in result && typeof result.error === "string" && !("url" in result)) {
    return { error: result.error }
  }
  return result as { url?: string; error?: string }
}

// ─── createPortalSession ─────────────────────────────────────

export async function createPortalSession(): Promise<{ url?: string; error?: string }> {
  const result = await withAuth("firma", "write", async ({ user, profile, db }) => {
    if (profile.role !== "owner") {
      return { error: "Nur der Geschäftsführer kann das Abrechnungsportal öffnen" }
    }

    const { data: company, error: companyErr } = await db
      .from("companies")
      .select("stripe_customer_id")
      .eq("id", profile.company_id)
      .single()

    if (companyErr || !company) {
      return { error: "Firma nicht gefunden" }
    }

    const customerId = company.stripe_customer_id
    if (!customerId) {
      return { error: "Kein aktives Abonnement. Bitte zuerst einen Plan wählen." }
    }

    try {
      const appUrl = getAppUrl()
      const session = await getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/firma?tab=abo`,
      })

      await logActivity({
        companyId: profile.company_id,
        userId: user.id,
        action: "portal_opened",
        entityType: "billing",
        entityId: profile.company_id,
        title: "Abrechnungsportal geöffnet",
      })

      return { url: session.url }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler"
      trackError("billing", "createPortalSession", msg, { companyId: profile.company_id })
      return { error: "Portal konnte nicht geöffnet werden." }
    }
  })

  if ("error" in result && typeof result.error === "string" && !("url" in result)) {
    return { error: result.error }
  }
  return result as { url?: string; error?: string }
}

// ─── getSubscriptionStatus ───────────────────────────────────

export async function getSubscriptionStatus(): Promise<{
  data?: SubscriptionStatus
  error?: string
}> {
  const result = await withAuth("firma", "read", async ({ profile, db }) => {
    const { data: company, error: companyErr } = await db
      .from("companies")
      .select("plan, trial_ends_at, stripe_subscription_id")
      .eq("id", profile.company_id)
      .single()

    if (companyErr || !company) return { error: "Firma nicht gefunden" }

    // Trial without Stripe
    if (company.plan === "trial") {
      const trialEnd = company.trial_ends_at ? new Date(company.trial_ends_at) : null
      const daysLeft = trialEnd
        ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
        : null
      return {
        data: {
          plan: "trial",
          status: "trialing",
          currentPeriodEnd: company.trial_ends_at,
          cancelAtPeriodEnd: false,
          trialDaysLeft: daysLeft,
        } satisfies SubscriptionStatus,
      }
    }

    // Paid plan with Stripe subscription
    if (company.stripe_subscription_id) {
      try {
        const sub = await getStripe().subscriptions.retrieve(company.stripe_subscription_id)
        // In Stripe v22, current_period_end is on SubscriptionItem, not Subscription
        const periodEnd = sub.items.data[0]?.current_period_end
        return {
          data: {
            plan: company.plan,
            status: sub.status,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            trialDaysLeft: null,
          } satisfies SubscriptionStatus,
        }
      } catch (err) {
        trackError(
          "billing",
          "getSubscriptionStatus",
          err instanceof Error ? err.message : "retrieve failed",
          { companyId: profile.company_id }
        )
        // Fail-closed: still return the plan we know from DB, status unknown
        return {
          data: {
            plan: company.plan,
            status: "unknown",
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialDaysLeft: null,
          } satisfies SubscriptionStatus,
        }
      }
    }

    // Plan set but no Stripe (admin-created)
    return {
      data: {
        plan: company.plan,
        status: "active",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialDaysLeft: null,
      } satisfies SubscriptionStatus,
    }
  })

  if ("error" in result && typeof result.error === "string" && !("data" in result)) {
    return { error: result.error }
  }
  return result as { data?: SubscriptionStatus; error?: string }
}
