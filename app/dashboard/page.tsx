import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, subscriptions, payments, users } from "@/db";
import { eq, desc } from "drizzle-orm";
import { PLANS } from "@/lib/plans";
import Link from "next/link";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
