import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export const PLANS = {
  starter: {
    name: "Starter",
    monthlyPrice: 4.99,
    annualPrice: 49.9,
    storage: "10 GB SSD",
    websites: "1 website",
    features: [
      "10 GB SSD storage",
      "1 website",
      "Free SSL certificate",
      "10 email accounts",
      "Weekly backups",
      "24/7 chat support",
    ],
    // Replace with your actual Stripe Price IDs
    stripePriceMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
    stripePriceAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL ?? "",
  },
  growth: {
    name: "Growth",
    monthlyPrice: 14.99,
    annualPrice: 149.9,
    storage: "50 GB SSD",
    websites: "10 websites",
    features: [
      "50 GB SSD storage",
      "10 websites",
      "Free SSL & global CDN",
      "Unlimited email accounts",
      "Daily backups",
      "Free domain for 1 year",
    ],
    stripePriceMonthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY ?? "",
    stripePriceAnnual: process.env.STRIPE_PRICE_GROWTH_ANNUAL ?? "",
  },
  business: {
    name: "Business",
    monthlyPrice: 34.99,
    annualPrice: 349.9,
    storage: "200 GB NVMe",
    websites: "Unlimited websites",
    features: [
      "200 GB NVMe storage",
      "Unlimited websites",
      "Free SSL, CDN & firewall",
      "Hourly backups",
      "Dedicated support manager",
      "Staging environments",
    ],
    stripePriceMonthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? "",
    stripePriceAnnual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL ?? "",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
