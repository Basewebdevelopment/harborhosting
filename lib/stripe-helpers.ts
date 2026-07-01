import "server-only";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

/** Current billing period now lives on the subscription's first item, not the subscription itself. */
export function getSubscriptionPeriod(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  return {
    currentPeriodStart: new Date(item.current_period_start * 1000),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
  };
}

/** Resolve the card/charge details and payment intent id for a paid invoice via its payments list. */
export async function getInvoiceCardDetails(invoice: Stripe.Invoice) {
  const invoicePayment = invoice.payments?.data[0];
  if (!invoicePayment) return { paymentIntentId: null, last4: null, brand: null };

  const payment = invoicePayment.payment;
  let charge: Stripe.Charge | null = null;
  let paymentIntentId: string | null = null;

  if (payment.type === "payment_intent" && payment.payment_intent) {
    paymentIntentId = typeof payment.payment_intent === "string" ? payment.payment_intent : payment.payment_intent.id;
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
    charge = (pi.latest_charge as Stripe.Charge | null) ?? null;
  } else if (payment.type === "charge" && payment.charge) {
    const chargeId = typeof payment.charge === "string" ? payment.charge : payment.charge.id;
    charge = await stripe.charges.retrieve(chargeId);
  }

  return {
    paymentIntentId,
    last4: charge?.payment_method_details?.card?.last4 ?? null,
    brand: charge?.payment_method_details?.card?.brand ?? null,
  };
}
