/**
 * One-time setup for Stripe LIVE mode:
 * - Creates products + prices (GBP)
 * - Creates webhook endpoint for Railway
 * - Prints env vars for Railway
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... \
 *     node scripts/setup-stripe-live.mjs
 */
import Stripe from "stripe";
import { config } from "dotenv";

config({ path: ".env.local" });

const secretKey = process.env.STRIPE_SECRET_KEY;
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!secretKey?.startsWith("sk_live_")) {
  throw new Error("Set STRIPE_SECRET_KEY to your LIVE secret key (sk_live_...). Toggle Live mode in Stripe Dashboard first.");
}
if (publishableKey && !publishableKey.startsWith("pk_live_")) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be pk_live_... for live mode.");
}

const WEBHOOK_URL =
  process.env.WEBHOOK_URL ??
  "https://harbor-hosting-production.up.railway.app/api/stripe/webhook";

const EVENTS = [
  "checkout.session.completed",
  "invoice.payment_succeeded",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

const plans = [
  { key: "starter", name: "Starter", description: "For your first website — 10 GB SSD, 1 website, free SSL", monthly: 599, annual: 5990 },
  { key: "growth", name: "Growth", description: "For growing businesses — 50 GB SSD, 10 websites, CDN, daily backups", monthly: 1499, annual: 14990 },
  { key: "business", name: "Business", description: "For high-traffic sites — 200 GB NVMe, unlimited websites, hourly backups", monthly: 3499, annual: 34990 },
];

const stripe = new Stripe(secretKey);
const priceIds = {};

console.log("Creating live products and prices...\n");

for (const plan of plans) {
  const product = await stripe.products.create({
    name: `Harbor Hosting — ${plan.name}`,
    description: plan.description,
    metadata: { plan: plan.key },
  });

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.monthly,
    currency: "gbp",
    recurring: { interval: "month" },
    nickname: `${plan.name} Monthly`,
    metadata: { plan: plan.key, billing: "monthly" },
  });

  const annualPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.annual,
    currency: "gbp",
    recurring: { interval: "year" },
    nickname: `${plan.name} Annual`,
    metadata: { plan: plan.key, billing: "annual" },
  });

  priceIds[plan.key] = { monthly: monthlyPrice.id, annual: annualPrice.id };
  console.log(`✓ ${plan.name}: ${monthlyPrice.id} / ${annualPrice.id}`);
}

// Recreate webhook to get signing secret
const existing = await stripe.webhookEndpoints.list({ limit: 100 });
for (const e of existing.data.filter((x) => x.url === WEBHOOK_URL)) {
  await stripe.webhookEndpoints.del(e.id);
  console.log("Removed old webhook:", e.id);
}

const webhook = await stripe.webhookEndpoints.create({
  url: WEBHOOK_URL,
  enabled_events: EVENTS,
  description: "Harbor Hosting — live (Railway)",
});

console.log("\n✅ Live Stripe setup complete.\n");
console.log("Set these on Railway (Settings → Variables):\n");
console.log(`STRIPE_SECRET_KEY=${secretKey}`);
if (publishableKey) console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${publishableKey}`);
console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
console.log(`STRIPE_PRICE_STARTER_MONTHLY=${priceIds.starter.monthly}`);
console.log(`STRIPE_PRICE_STARTER_ANNUAL=${priceIds.starter.annual}`);
console.log(`STRIPE_PRICE_GROWTH_MONTHLY=${priceIds.growth.monthly}`);
console.log(`STRIPE_PRICE_GROWTH_ANNUAL=${priceIds.growth.annual}`);
console.log(`STRIPE_PRICE_BUSINESS_MONTHLY=${priceIds.business.monthly}`);
console.log(`STRIPE_PRICE_BUSINESS_ANNUAL=${priceIds.business.annual}`);
console.log("\nThen redeploy Railway.");
