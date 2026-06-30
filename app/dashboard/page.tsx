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

  // If returning from Stripe checkout, sync subscription directly (webhook fallback)
  const { session_id } = await searchParams;
  if (session_id) {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
      if (checkoutSession.payment_status === "paid") {
        const { userId, plan, billing } = checkoutSession.metadata ?? {};
        if (userId && plan && billing && userId === session.user.id) {
          const stripeSubId = checkoutSession.subscription as string;
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
          const item = stripeSub.items.data[0];
          const [existing] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .limit(1);
          const vals = {
            userId,
            stripeCustomerId: checkoutSession.customer as string,
            stripeSubscriptionId: stripeSubId,
            stripePriceId: item?.price.id ?? null,
            plan: plan as "starter" | "growth" | "business",
            billingPeriod: billing as "monthly" | "annual",
            subscriptionStatus: "active" as const,
            currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
            currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
          };
          if (existing) {
            await db.update(subscriptions).set({ ...vals, updatedAt: new Date() }).where(eq(subscriptions.userId, userId));
          } else {
            await db.insert(subscriptions).values({ id: nanoid(), ...vals, cancelAtPeriodEnd: false });
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
