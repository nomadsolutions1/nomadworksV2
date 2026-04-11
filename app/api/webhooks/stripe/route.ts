import { NextRequest, NextResponse } from "next/server"
import { getStripe, getPricePlanMap } from "@/lib/services/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { PLANS } from "@/lib/utils/constants"
import { trackError } from "@/lib/utils/error-tracker"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    trackError("stripe-webhook", "constructEvent", msg, {})
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 })
  }

  const db = createAdminClient()

  try {
    switch (event.type) {
      // ─── checkout.session.completed → Activate plan ──────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const companyId = session.metadata?.company_id
        const plan = session.metadata?.plan

        if (!companyId || !plan) {
          console.warn("[stripe-webhook] checkout.session.completed missing metadata", { companyId, plan })
          break
        }

        const planInfo = PLANS[plan as keyof typeof PLANS]
        const subscriptionId = session.subscription as string | null

        // Idempotency: skip if this subscription is already recorded on the company.
        // Stripe may re-deliver the same event; mutating again would reset trial_ends_at
        // even though nothing changed.
        const { data: existing } = await db
          .from("companies")
          .select("plan, stripe_subscription_id")
          .eq("id", companyId)
          .maybeSingle()

        if (
          existing &&
          existing.plan === plan &&
          existing.stripe_subscription_id === subscriptionId
        ) {
          console.log(`[stripe-webhook] checkout.session.completed (${event.id}) already applied, skip`)
          break
        }

        await db
          .from("companies")
          .update({
            plan,
            is_active: true,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            max_employees: planInfo?.maxEmployees ?? 10,
            monthly_price: planInfo?.price ?? 0,
            trial_ends_at: null,
          })
          .eq("id", companyId)

        console.log(`[stripe-webhook] Plan "${plan}" activated for company ${companyId}`)
        break
      }

      // ─── customer.subscription.updated → Update plan ─────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const companyId = subscription.metadata?.company_id

        if (!companyId) {
          console.warn("[stripe-webhook] subscription.updated missing company_id in metadata")
          break
        }

        // Determine plan from price ID
        const priceId = subscription.items.data[0]?.price?.id
        const pricePlanMap = getPricePlanMap()
        const newPlan = priceId ? pricePlanMap[priceId] : null

        if (newPlan) {
          const planInfo = PLANS[newPlan as keyof typeof PLANS]
          const shouldBeActive = subscription.status === "active"

          // Idempotency: skip if state already matches
          const { data: existing } = await db
            .from("companies")
            .select("plan, is_active")
            .eq("id", companyId)
            .maybeSingle()

          if (
            existing &&
            existing.plan === newPlan &&
            existing.is_active === shouldBeActive
          ) {
            console.log(`[stripe-webhook] subscription.updated (${event.id}) already applied, skip`)
            break
          }

          await db
            .from("companies")
            .update({
              plan: newPlan,
              max_employees: planInfo?.maxEmployees ?? 10,
              monthly_price: planInfo?.price ?? 0,
              is_active: shouldBeActive,
            })
            .eq("id", companyId)

          console.log(`[stripe-webhook] Plan changed to "${newPlan}" for company ${companyId}`)
        }
        break
      }

      // ─── customer.subscription.deleted → Deactivate plan ─────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const companyId = subscription.metadata?.company_id

        if (!companyId) {
          console.warn("[stripe-webhook] subscription.deleted missing company_id in metadata")
          break
        }

        // Idempotency: skip if already deactivated
        const { data: existing } = await db
          .from("companies")
          .select("plan, stripe_subscription_id")
          .eq("id", companyId)
          .maybeSingle()

        if (existing && existing.plan === "trial" && existing.stripe_subscription_id === null) {
          console.log(`[stripe-webhook] subscription.deleted (${event.id}) already applied, skip`)
          break
        }

        await db
          .from("companies")
          .update({
            plan: "trial",
            is_active: false,
            stripe_subscription_id: null,
            max_employees: 5,
            monthly_price: 0,
          })
          .eq("id", companyId)

        // Create a notification for the company owner
        await db
          .from("notifications")
          .insert({
            company_id: companyId,
            type: "billing",
            title: "Abonnement beendet",
            message: "Ihr Abonnement wurde beendet. Bitte erneuern Sie Ihren Plan, um alle Funktionen weiter zu nutzen.",
            severity: "warning",
          })

        console.log(`[stripe-webhook] Subscription deleted for company ${companyId}`)
        break
      }

      // ─── invoice.payment_failed → Warning notification ───────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        if (!customerId) break

        // Find company by stripe_customer_id
        const { data: company } = await db
          .from("companies")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle()

        if (company) {
          // Idempotency: avoid duplicate notifications if Stripe redelivers.
          // Scope by event.id stored in the notification link field.
          const eventLink = `stripe_event:${event.id}`
          const { data: existingNote } = await db
            .from("notifications")
            .select("id")
            .eq("company_id", company.id)
            .eq("link", eventLink)
            .maybeSingle()

          if (existingNote) {
            console.log(`[stripe-webhook] payment_failed (${event.id}) notification already created, skip`)
            break
          }

          await db
            .from("notifications")
            .insert({
              company_id: company.id,
              type: "billing",
              title: "Zahlung fehlgeschlagen",
              message: "Die letzte Zahlung für Ihr Abonnement konnte nicht verarbeitet werden. Bitte aktualisieren Sie Ihre Zahlungsmethode.",
              severity: "warning",
              link: eventLink,
            })

          console.log(`[stripe-webhook] Payment failed for company ${company.id}`)
        }
        break
      }

      default:
        // Unhandled event type — ignore
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    trackError("stripe-webhook", event.type, msg, {})
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
