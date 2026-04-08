import Stripe from "stripe"

// Lazy initialization — Stripe client is only created when first used at runtime,
// not at build time when env vars may not be available
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  }
  return _stripe
}

export function getPlanPriceMap(): Record<string, string> {
  return {
    starter: process.env.STRIPE_PRICE_STARTER || "",
    business: process.env.STRIPE_PRICE_BUSINESS || "",
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE || "",
  }
}

export function getPricePlanMap(): Record<string, string> {
  const planPriceMap = getPlanPriceMap()
  return Object.fromEntries(
    Object.entries(planPriceMap).map(([plan, priceId]) => [priceId, plan])
  )
}
