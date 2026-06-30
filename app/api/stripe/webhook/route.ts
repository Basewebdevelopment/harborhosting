import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db, subscriptions, payments } from "@/db";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] signature error", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessionMeta = (session as any).subscription_data?.metadata ?? {};
      const { userId, plan, billing } = sessionMeta;
      if (!userId || !plan || !billing) break;

      const stripeSubId = session.subscription as string;
      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);

      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const item = stripeSub.items.data[0];
      const sharedValues = {
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: stripeSubId,
        stripePriceId: item?.price.id,
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
        await db.insert(subscriptions).values({ id: nanoid(), ...sharedValues, cancelAtPeriodEnd: false });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any;
      const stripeSubId = invoice.subscription as string | null;
      if (!stripeSubId) break;

      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubId))
        .limit(1);

      if (!sub) break;

      const pi = invoice.payment_intent as string | null;
      const chargeId = invoice.charge as string | null;
      const charge = chargeId
        ? await stripe.charges.retrieve(chargeId)
        : null;

      await db.insert(payments).values({
        id: nanoid(),
        userId: sub.userId,
        stripePaymentIntentId: pi ?? null,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid as number,
        currency: invoice.currency as string,
        status: "paid",
        description: (invoice.lines?.data[0]?.description as string | null) ?? "Subscription payment",
        last4: charge?.payment_method_details?.card?.last4 ?? null,
        brand: charge?.payment_method_details?.card?.brand ?? null,
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const item = sub.items.data[0];
      await db
        .update(subscriptions)
        .set({
          subscriptionStatus: sub.status as "active" | "canceled" | "past_due" | "trialing",
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
          currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db
        .update(subscriptions)
        .set({ subscriptionStatus: "canceled", updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      break;
    }
  }

  return NextResponse.json({ received: true });
}
