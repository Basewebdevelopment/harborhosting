import "server-only";
import { stripe } from "@/lib/stripe";
import { getSubscriptionPeriod, getInvoiceCardDetails, resolveStripeCustomerId } from "@/lib/stripe-helpers";
import { db, subscriptions, payments, users } from "@/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

async function syncInvoicesForCustomer(userId: string, customerId: string, planLabel?: string) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 10,
    status: "paid",
    expand: ["data.payments"],
  });
  for (const inv of invoices.data) {
    const [exists] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripeInvoiceId, inv.id))
      .limit(1);
    if (exists) continue;

    const cardDetails = await getInvoiceCardDetails(inv);

    await db.insert(payments).values({
      id: nanoid(),
      userId,
      stripePaymentIntentId: cardDetails.paymentIntentId,
      stripeInvoiceId: inv.id,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: "paid",
      description: inv.lines?.data[0]?.description ?? planLabel ?? "Subscription payment",
      last4: cardDetails.last4,
      brand: cardDetails.brand,
    });
  }
}

/** Sync subscription + payments from Stripe when DB is missing records. */
export async function syncBillingFromStripe(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.email) return;

  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const customerId = await resolveStripeCustomerId({
    userId,
    email: user.email,
    name: user.name,
    existingCustomerId: existingSub?.stripeCustomerId,
  });

  let planLabel = existingSub?.plan ? `${existingSub.plan} plan` : undefined;

  if (existingSub && existingSub.stripeCustomerId !== customerId) {
    await db
      .update(subscriptions)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId));
  }

  if (!existingSub) {
    const stripeSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
      expand: ["data.items"],
    });
    const activeSub = stripeSubs.data[0];
    if (activeSub) {
      const item = activeSub.items.data[0];
      const subMeta = activeSub.metadata ?? {};
      const plan = (subMeta.plan ?? item?.price?.metadata?.plan ?? "starter") as
        | "starter"
        | "growth"
        | "business";
      const billing = (subMeta.billing ??
        (item?.price?.recurring?.interval === "year" ? "annual" : "monthly")) as
        | "monthly"
        | "annual";

      planLabel = `${plan} plan`;

      await db.insert(subscriptions).values({
        id: nanoid(),
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: activeSub.id,
        stripePriceId: item?.price.id ?? null,
        plan,
        billingPeriod: billing,
        subscriptionStatus: "active",
        ...getSubscriptionPeriod(activeSub),
        cancelAtPeriodEnd: activeSub.cancel_at_period_end,
      });
    }
  }

  await syncInvoicesForCustomer(userId, customerId, planLabel);
}
