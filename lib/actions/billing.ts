"use server"

import { getStripe, getPlanPriceMap } from "@/lib/services/stripe"
import { requireCompanyAuth } from "@/lib/utils/auth-helper"

type AnyRow = Record<string, unknown>

// ─── Types ───────────────────────────────────────────────────

export type SubscriptionStatus = {
  plan: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  trialDaysLeft: number | null
}

// ─── createCheckoutSession ───────────────────────────────────

export async function createCheckoutSession(
  plan: "starter" | "business" | "enterprise"
): Promise<{ url?: string; error?: string }> {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { error: "Nicht authentifiziert" }
  if (profile.role !== "owner") return { error: "Nur der Geschäftsführer kann den Plan ändern" }

  const priceId = getPlanPriceMap()[plan]
  if (!priceId) return { error: "Ungültiger Plan" }

  const { data: company } = await db
    .from("companies")
    .select("id, name, stripe_customer_id")
    .eq("id", profile.company_id)
    .single()

  if (!company) return { error: "Firma nicht gefunden" }
  const c = company as AnyRow

  // Create or reuse Stripe customer
  let customerId = c.stripe_customer_id as string | null
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      name: c.name as string,
      metadata: {
        company_id: c.id as string,
        nomadworks_plan: plan,
      },
    })
    customerId = customer.id

    await db
      .from("companies")
      .update({ stripe_customer_id: customerId })
      .eq("id", c.id as string)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomadworks.vercel.app"

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/firma?billing=success`,
    cancel_url: `${appUrl}/firma?billing=cancelled`,
    metadata: {
      company_id: c.id as string,
      plan,
    },
    subscription_data: {
      metadata: {
        company_id: c.id as string,
        plan,
      },
    },
  })

  return { url: session.url ?? undefined }
}

// ─── createPortalSession ─────────────────────────────────────

export async function createPortalSession(): Promise<{ url?: string; error?: string }> {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { error: "Nicht authentifiziert" }
  if (profile.role !== "owner") return { error: "Nur der Geschäftsführer kann das Abrechnungsportal öffnen" }

  const { data: company } = await db
    .from("companies")
    .select("stripe_customer_id")
    .eq("id", profile.company_id)
    .single()

  const customerId = (company as AnyRow | null)?.stripe_customer_id as string | null
  if (!customerId) {
    return { error: "Kein aktives Abonnement. Bitte zuerst einen Plan wählen." }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomadworks.vercel.app"

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/firma`,
  })

  return { url: session.url }
}

// ─── getSubscriptionStatus ───────────────────────────────────

export async function getSubscriptionStatus(): Promise<{
  data?: SubscriptionStatus
  error?: string
}> {
  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) return { error: "Nicht authentifiziert" }

  const { data: company } = await db
    .from("companies")
    .select("plan, trial_ends_at, stripe_subscription_id")
    .eq("id", profile.company_id)
    .single()

  if (!company) return { error: "Firma nicht gefunden" }
  const c = company as AnyRow

  // Trial without Stripe
  if (c.plan === "trial") {
    const trialEnd = c.trial_ends_at ? new Date(c.trial_ends_at as string) : null
    const daysLeft = trialEnd
      ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
      : null
    return {
      data: {
        plan: "trial",
        status: "trialing",
        currentPeriodEnd: c.trial_ends_at as string | null,
        cancelAtPeriodEnd: false,
        trialDaysLeft: daysLeft,
      },
    }
  }

  // Paid plan with Stripe subscription
  if (c.stripe_subscription_id) {
    const sub = await getStripe().subscriptions.retrieve(c.stripe_subscription_id as string)
    // In Stripe v22, current_period_end is on SubscriptionItem, not Subscription
    const periodEnd = sub.items.data[0]?.current_period_end
    return {
      data: {
        plan: c.plan as string,
        status: sub.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        trialDaysLeft: null,
      },
    }
  }

  // Plan set but no Stripe (admin-created)
  return {
    data: {
      plan: c.plan as string,
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialDaysLeft: null,
    },
  }
}
