import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, subscriptions, payments, users } from "@/db";
import { eq, desc } from "drizzle-orm";
import { PLANS } from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { nanoid } from "nanoid";
import Link from "next/link";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; session_id?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // If returning from Stripe checkout, sync subscription + payment directly (webhook fallback)
  const { session_id } = await searchParams;
  if (session_id) {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["invoice", "subscription"],
      });

      if (checkoutSession.payment_status === "paid") {
        const { userId, plan, billing } = checkoutSession.metadata ?? {};
        if (userId && plan && billing && userId === session.user.id) {
          const stripeSub = checkoutSession.subscription as import("stripe").Stripe.Subscription;
          const stripeSubId = stripeSub.id;
          const item = stripeSub.items.data[0];

          // Upsert subscription
          const [existingSub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .limit(1);

          const subVals = {
            userId,
            stripeCustomerId: checkoutSession.customer as string,
            stripeSubscriptionId: stripeSubId,
            stripePriceId: item?.price.id ?? null,
            plan: plan as "starter" | "growth" | "business",
            billingPeriod: billing as "monthly" | "annual",
            subscriptionStatus: "active" as const,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          };

          if (existingSub) {
            await db.update(subscriptions).set({ ...subVals, updatedAt: new Date() }).where(eq(subscriptions.userId, userId));
          } else {
            await db.insert(subscriptions).values({ id: nanoid(), ...subVals, cancelAtPeriodEnd: false });
          }

          // Sync payment record from invoice
          const invoice = checkoutSession.invoice as import("stripe").Stripe.Invoice | null;
          if (invoice && invoice.id) {
            const [existingPayment] = await db
              .select()
              .from(payments)
              .where(eq(payments.stripeInvoiceId, invoice.id))
              .limit(1);

            if (!existingPayment) {
              // Retrieve charge for card details
              const chargeId = typeof invoice.charge === "string" ? invoice.charge : invoice.charge?.id ?? null;
              const charge = chargeId ? await stripe.charges.retrieve(chargeId) : null;

              await db.insert(payments).values({
                id: nanoid(),
                userId,
                stripePaymentIntentId: typeof invoice.payment_intent === "string" ? invoice.payment_intent : null,
                stripeInvoiceId: invoice.id,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: "paid",
                description: invoice.lines?.data[0]?.description ?? `${plan} plan — ${billing} billing`,
                last4: charge?.payment_method_details?.card?.last4 ?? null,
                brand: charge?.payment_method_details?.card?.brand ?? null,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("[dashboard] sync error", err);
    }
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  const recentPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, session.user.id))
    .orderBy(desc(payments.createdAt))
    .limit(3);

  const plan = sub ? PLANS[sub.plan] : null;

  return (
    <DashboardClient
      user={{ name: user.name, email: user.email }}
      subscription={
        sub
          ? {
              plan: sub.plan,
              billingPeriod: sub.billingPeriod,
              status: sub.subscriptionStatus,
              currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
            }
          : null
      }
      planConfig={plan}
      recentPayments={recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        description: p.description ?? "",
        last4: p.last4 ?? "",
        brand: p.brand ?? "",
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
