import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { resolveStripeCustomerId } from "@/lib/stripe-helpers";
import { db, subscriptions, users } from "@/db";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user?.email) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    const customerId = await resolveStripeCustomerId({
      userId: session.user.id,
      email: user.email,
      name: user.name,
      existingCustomerId: sub?.stripeCustomerId,
    });

    if (sub && sub.stripeCustomerId !== customerId) {
      await db
        .update(subscriptions)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(subscriptions.userId, session.user.id));
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    const message =
      err instanceof Error ? err.message : "Could not open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
