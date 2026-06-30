import "server-only";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

// Stripe Price IDs — set in .env.local / Railway env vars
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL ?? "",
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL ?? "",
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL ?? "",
  },
} as const;
