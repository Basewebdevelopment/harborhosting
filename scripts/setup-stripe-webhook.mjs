/**
 * Creates or updates the Stripe webhook endpoint for Harbor Hosting (test mode).
 * Usage: node scripts/setup-stripe-webhook.mjs
 */
import Stripe from "stripe";
import { config } from "dotenv";

config({ path: ".env.local" });

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("STRIPE_SECRET_KEY not set in .env.local");

const WEBHOOK_URL =
  process.env.WEBHOOK_URL ??
  "https://harbor-hosting-production.up.railway.app/api/stripe/webhook";

const EVENTS = [
  "checkout.session.completed",
  "invoice.payment_succeeded",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

const stripe = new Stripe(key);

const existing = await stripe.webhookEndpoints.list({ limit: 100 });
let endpoint = existing.data.find((e) => e.url === WEBHOOK_URL);

if (endpoint) {
  endpoint = await stripe.webhookEndpoints.update(endpoint.id, {
    enabled_events: EVENTS,
    disabled: false,
  });
  console.log("Updated existing webhook endpoint:", endpoint.id);
} else {
  endpoint = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: EVENTS,
    description: "Harbor Hosting — production (Railway)",
  });
  console.log("Created webhook endpoint:", endpoint.id);
}

console.log("\nURL:", endpoint.url);
console.log("Events:", endpoint.enabled_events.join(", "));

// Signing secret is only returned on create — retrieve if updating
let secret = endpoint.secret;
if (!secret) {
  // List webhook endpoints doesn't include secret; create a new one by deleting and recreating
  // OR use stripe CLI. Actually for update, secret stays the same.
  // Check if we need to get secret from dashboard
  const full = await stripe.webhookEndpoints.retrieve(endpoint.id);
  secret = full.secret;
}

if (secret) {
  console.log("\n✅ Add this to Railway (STRIPE_WEBHOOK_SECRET):");
  console.log(secret);
} else {
  console.log(
    "\n⚠️  Signing secret not in API response (endpoint already existed)."
  );
  console.log("Get it from Stripe Dashboard → Developers → Webhooks →", endpoint.id);
}
