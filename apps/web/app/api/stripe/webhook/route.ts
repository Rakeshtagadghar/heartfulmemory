import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { anyApi, convexMutation, convexQuery } from "../../../../lib/convex/ops";
import { getStripeClient, getStripeWebhookSecret } from "../../../../lib/stripe/stripeClient";
import { mapStripeSubscriptionForUpsert } from "../../../../lib/stripe/webhookMapper";
import { captureAppError, captureAppWarning } from "../../../../../../lib/observability/capture";

export const runtime = "nodejs";

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const fromParent = invoice.parent?.subscription_details?.subscription;
  if (typeof fromParent === "string") return fromParent;
  if (fromParent && typeof fromParent === "object" && "id" in fromParent) {
    return typeof fromParent.id === "string" ? fromParent.id : null;
  }

  const fromLineItem = invoice.lines.data.find((line) => {
    if (typeof line.subscription === "string") return true;
    if (line.subscription && typeof line.subscription === "object" && "id" in line.subscription) {
      return typeof line.subscription.id === "string";
    }
    return false;
  });
  if (!fromLineItem) return null;
  if (typeof fromLineItem.subscription === "string") return fromLineItem.subscription;
  if (fromLineItem.subscription && typeof fromLineItem.subscription === "object" && "id" in fromLineItem.subscription) {
    return typeof fromLineItem.subscription.id === "string" ? fromLineItem.subscription.id : null;
  }
  return null;
}

async function getFallbackUserIdForCustomer(stripeCustomerId: string) {
  const customer = await convexQuery<{ userId: string } | null>(
    anyApi.billing.getCustomerByStripeCustomerIdInternal,
    { stripeCustomerId }
  );
  if (!customer.ok) return null;
  return customer.data?.userId ?? null;
}

async function upsertFromSubscription(input: {
  eventId: string;
  eventType: string;
  subscription: Stripe.Subscription;
  fallbackUserId?: string | null;
}) {
  const mapped = mapStripeSubscriptionForUpsert({
    subscription: input.subscription,
    fallbackUserId: input.fallbackUserId
  });
  if (!mapped) return { ok: false as const, reason: "missing-user-or-customer" };

  const result = await convexMutation<{ ok: boolean; deduped?: boolean }>(
    anyApi.billing.upsertSubscriptionFromStripeInternal,
    {
      stripeEventId: input.eventId,
      stripeEventType: input.eventType,
      ...mapped
    }
  );
  if (!result.ok) {
    return { ok: false as const, reason: result.error };
  }
  return { ok: true as const, deduped: result.data.deduped ?? false };
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing stripe-signature header." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? "";
        const fallbackUserId = (session.client_reference_id ?? session.metadata?.userId ?? "").trim();
        if (customerId && fallbackUserId) {
          await convexMutation<{ ok: boolean }>(anyApi.billing.upsertCustomerFromStripeInternal, {
            userId: fallbackUserId,
            stripeCustomerId: customerId
          });
        }
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const fallbackByCustomer = customerId
          ? await getFallbackUserIdForCustomer(customerId)
          : null;
        await upsertFromSubscription({
          eventId: event.id,
          eventType: event.type,
          subscription,
          fallbackUserId: fallbackUserId || fallbackByCustomer
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? "";
      const fallbackUserId = customerId ? await getFallbackUserIdForCustomer(customerId) : null;
      const upserted = await upsertFromSubscription({
        eventId: event.id,
        eventType: event.type,
        subscription,
        fallbackUserId
      });
      if (!upserted.ok) {
        captureAppWarning("Subscription webhook ignored due to missing identity mapping", {
          runtime: "server",
          flow: "billing_webhook",
          feature: "billing",
          code: "WEBHOOK_MAPPING_MISSING",
          extra: {
            eventId: event.id,
            eventType: event.type
          }
        });
      } else if (subscription.status === "active" || subscription.status === "trialing") {
        captureAppWarning("billing_webhook_subscription_active", {
          runtime: "server",
          flow: "billing_webhook",
          feature: "billing",
          code: "BILLING_WEBHOOK_SUBSCRIPTION_ACTIVE",
          extra: {
            eventId: event.id,
            eventType: event.type,
            subscriptionId: subscription.id
          }
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (!subscriptionId) return NextResponse.json({ ok: true, ignored: "invoice_without_subscription" });
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? "";
      const fallbackUserId = customerId ? await getFallbackUserIdForCustomer(customerId) : null;
      await upsertFromSubscription({
        eventId: event.id,
        eventType: event.type,
        subscription,
        fallbackUserId
      });
      if (event.type === "invoice.payment_failed") {
        captureAppWarning("billing_webhook_payment_failed", {
          runtime: "server",
          flow: "billing_webhook",
          feature: "billing",
          code: "BILLING_WEBHOOK_PAYMENT_FAILED",
          extra: {
            eventId: event.id,
            eventType: event.type,
            subscriptionId
          }
        });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, ignored: event.type });
  } catch (error) {
    captureAppError(error, {
      runtime: "server",
      flow: "billing_webhook",
      feature: "billing",
      code: "BILLING_WEBHOOK_PROCESS_FAILED",
      extra: {
        eventId: event.id,
        eventType: event.type
      }
    });
    return NextResponse.json({ ok: false, error: "Webhook processing failed." }, { status: 500 });
  }
}
