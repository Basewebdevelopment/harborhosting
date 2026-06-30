import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db, subscriptions } from "@/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ synced: false });
    }

    const { userId, plan, billing } = checkoutSession.metadata ?? {};
    if (!userId || !plan || !billing || userId !== session.user.id) {
      return NextResponse.json({ error: "Metadata mismatch" }, { status: 400 });
    }

    const stripeSubId = checkoutSession.subscription as string;
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
    const item = stripeSub.items.data[0];

    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    const sharedValues = {
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
      await db
        .update(subscriptions)
        .set({ ...sharedValues, updatedAt: new Date() })
        .where(eq(subscriptions.userId, userId));
    } else {
      await db.insert(subscriptions).values({
        id: nanoid(),
        ...sharedValues,
        cancelAtPeriodEnd: false,
      });
    }

    return NextResponse.json({ synced: true });
  } catch (err) {
    console.error("[stripe/sync]", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
