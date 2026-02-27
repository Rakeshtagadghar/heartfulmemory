import type Stripe from "stripe";
import { getAllowedPriceById } from "./priceAllowlist";

export type NormalizedStripeSubscription = {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete";
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  latestInvoiceId: string | null;
};

function normalizeStatus(value: Stripe.Subscription.Status): NormalizedStripeSubscription["status"] {
  switch (value) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "incomplete":
      return value;
    default:
      return "incomplete";
  }
}

function planIdFromSubscription(subscription: Stripe.Subscription) {
  const metadataPlan = (subscription.metadata?.planId ?? "").trim();
  if (metadataPlan.length > 0) return metadataPlan;
  const firstPriceId = subscription.items.data[0]?.price?.id ?? null;
  if (!firstPriceId) return "free";
  return getAllowedPriceById(firstPriceId)?.planId ?? "free";
}

function getCurrentPeriodEndMs(subscription: Stripe.Subscription) {
  const firstItemPeriodEnd = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => b - a)[0];
  if (typeof firstItemPeriodEnd === "number") return firstItemPeriodEnd * 1000;
  if (typeof subscription.trial_end === "number") return subscription.trial_end * 1000;
  return null;
}

export function mapStripeSubscriptionForUpsert(input: {
  subscription: Stripe.Subscription;
  fallbackUserId?: string | null;
}) {
  const customerId =
    typeof input.subscription.customer === "string"
      ? input.subscription.customer
      : input.subscription.customer?.id ?? "";
  const userId = (input.subscription.metadata?.userId ?? input.fallbackUserId ?? "").trim();
  if (!customerId || !userId) return null;
  return {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: input.subscription.id,
    planId: planIdFromSubscription(input.subscription),
    status: normalizeStatus(input.subscription.status),
    currentPeriodEnd: getCurrentPeriodEndMs(input.subscription),
    cancelAtPeriodEnd: Boolean(input.subscription.cancel_at_period_end),
    latestInvoiceId:
      typeof input.subscription.latest_invoice === "string"
        ? input.subscription.latest_invoice
        : input.subscription.latest_invoice?.id ?? null
  } satisfies NormalizedStripeSubscription;
}
