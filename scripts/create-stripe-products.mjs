import Stripe from "stripe";
import { config } from "dotenv";
config({ path: ".env.local" });

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("STRIPE_SECRET_KEY not set in .env.local");

const stripe = new Stripe(key);

const plans = [
  {
    key: "starter",
    name: "Starter",
    description: "For your first website — 10 GB SSD, 1 website, free SSL",
    monthly: 599,   // £5.99 in pence
    annual: 5990,   // £59.90 in pence
  },
  {
    key: "growth",
    name: "Growth",
    description: "For growing businesses — 50 GB SSD, 10 websites, CDN, daily backups",
    monthly: 1499,  // £14.99
    annual: 14990,  // £149.90
  },
  {
    key: "business",
    name: "Business",
    description: "For high-traffic sites — 200 GB NVMe, unlimited websites, hourly backups",
    monthly: 3499,  // £34.99
    annual: 34990,  // £349.90
  },
];

const priceIds = {};

for (const plan of plans) {
  console.log(`\nCreating product: ${plan.name}...`);

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

  priceIds[plan.key] = {
    monthly: monthlyPrice.id,
    annual: annualPrice.id,
  };

  console.log(`  ✓ Monthly price ID: ${monthlyPrice.id}`);
  console.log(`  ✓ Annual price ID:  ${annualPrice.id}`);
}

console.log("\n✅ All products created!\n");
console.log("Add these to .env.local and Railway:\n");
console.log(`STRIPE_PRICE_STARTER_MONTHLY="${priceIds.starter.monthly}"`);
console.log(`STRIPE_PRICE_STARTER_ANNUAL="${priceIds.starter.annual}"`);
console.log(`STRIPE_PRICE_GROWTH_MONTHLY="${priceIds.growth.monthly}"`);
console.log(`STRIPE_PRICE_GROWTH_ANNUAL="${priceIds.growth.annual}"`);
console.log(`STRIPE_PRICE_BUSINESS_MONTHLY="${priceIds.business.monthly}"`);
console.log(`STRIPE_PRICE_BUSINESS_ANNUAL="${priceIds.business.annual}"`);
