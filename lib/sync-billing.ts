import "server-only";
import { stripe } from "@/lib/stripe";
import { db, subscriptions, payments, users } from "@/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

async function syncInvoicesForCustomer(userId: string, customerId: string, planLabel?: string) {
  const invoices = await stripe.invoices.list({ customer: customerId, limit: 10, status: "paid" });
  for (const inv of invoices.data) {
    const [exists] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripeInvoiceId, inv.id))
      .limit(1);
    if (exists) continue;

    const chargeId =
      typeof inv.charge === "string" ? inv.charge : (inv.charge as { id?: string } | null)?.id ?? null;
    const charge = chargeId ? await stripe.charges.retrieve(chargeId) : null;

    await db.insert(payments).values({
      id: nanoid(),
      userId,
      stripePaymentIntentId: typeof inv.payment_intent === "string" ? inv.payment_intent : null,
      stripeInvoiceId: inv.id,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: "paid",
      description: inv.lines?.data[0]?.description ?? planLabel ?? "Subscription payment",
      last4: charge?.payment_method_details?.card?.last4 ?? null,
      brand: charge?.payment_method_details?.card?.brand ?? null,
    });
  }
}

/** Sync subscription + payments from Stripe when DB is missing records. */
export async function syncBillingFromStripe(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.email) return;

  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = customers.data[0];
  if (!customer) return;

  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  let planLabel = existingSub?.plan ? `${existingSub.plan} plan` : undefined;

  if (!existingSub) {
    const stripeSubs = await stripe.subscriptions.list({
      customer: customer.id,
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
        stripeCustomerId: customer.id,
        stripeSubscriptionId: activeSub.id,
        stripePriceId: item?.price.id ?? null,
        plan,
        billingPeriod: billing,
        subscriptionStatus: "active",
        currentPeriodStart: new Date(activeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(activeSub.current_period_end * 1000),
        cancelAtPeriodEnd: activeSub.cancel_at_period_end,
      });
    }
  }

  await syncInvoicesForCustomer(userId, customer.id, planLabel);
}
