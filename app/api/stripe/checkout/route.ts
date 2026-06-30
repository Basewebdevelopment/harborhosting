import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { PLANS, type PlanKey } from "@/lib/plans";
import { db, subscriptions, users } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { plan, billing } = await req.json() as {
    plan: PlanKey;
    billing: "monthly" | "annual";
  };

  const planConfig = PLANS[plan];
  if (!planConfig) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId =
    billing === "annual"
      ? STRIPE_PRICE_IDS[plan].annual
      : STRIPE_PRICE_IDS[plan].monthly;

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe Price ID not configured for this plan. Please add it to .env.local." },
      { status: 500 }
    );
  }

  // Find or create Stripe customer
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

  let customerId = sub?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    currency: "gbp",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    subscription_data: {
      metadata: {
        userId: session.user.id,
        plan,
        billing,
      },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
