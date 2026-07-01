import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getInvoiceCardDetails } from "@/lib/stripe-helpers";
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

  console.log("[webhook] received", event.type, event.id);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // metadata lives on session.metadata (set at checkout session creation)
      const { userId, plan, billing } = session.metadata ?? {};
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
      const invoiceStub = event.data.object as Stripe.Invoice;
      const subDetails = invoiceStub.parent?.subscription_details?.subscription ?? null;
      const stripeSubId = typeof subDetails === "string" ? subDetails : subDetails?.id ?? null;
      if (!stripeSubId) break;

      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubId))
        .limit(1);

      if (!sub) break;

      const invoice = await stripe.invoices.retrieve(invoiceStub.id!, { expand: ["payments"] });
      const cardDetails = await getInvoiceCardDetails(invoice);

      await db.insert(payments).values({
        id: nanoid(),
        userId: sub.userId,
        stripePaymentIntentId: cardDetails.paymentIntentId,
        stripeInvoiceId: invoice.id!,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: "paid",
        description: invoice.lines?.data[0]?.description ?? "Subscription payment",
        last4: cardDetails.last4,
        brand: cardDetails.brand,
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
