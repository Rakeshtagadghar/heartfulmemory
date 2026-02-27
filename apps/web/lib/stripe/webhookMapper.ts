import type Stripe from "stripe";
import { getAllowedPriceById } from "./priceAllowlist";

export type NormalizedStripeSubscription = {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete";
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: number | null;
  canceledAt: number | null;
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

function getCurrentPeriodBoundsMs(subscription: Stripe.Subscription) {
  const earliestItemPeriodStart = subscription.items.data
    .map((item) => item.current_period_start)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b)[0];
  const latestItemPeriodEnd = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => b - a)[0];
  const periodStartMs =
    typeof earliestItemPeriodStart === "number"
      ? earliestItemPeriodStart * 1000
      : typeof subscription.trial_start === "number"
        ? subscription.trial_start * 1000
        : subscription.start_date * 1000;
  const periodEndMs =
    typeof latestItemPeriodEnd === "number"
      ? latestItemPeriodEnd * 1000
      : typeof subscription.trial_end === "number"
        ? subscription.trial_end * 1000
        : null;
  return {
    periodStartMs,
    periodEndMs
  };
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
  const period = getCurrentPeriodBoundsMs(input.subscription);
  return {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: input.subscription.id,
    planId: planIdFromSubscription(input.subscription),
    status: normalizeStatus(input.subscription.status),
    currentPeriodStart: period.periodStartMs,
    currentPeriodEnd: period.periodEndMs,
    cancelAtPeriodEnd: Boolean(input.subscription.cancel_at_period_end),
    cancelAt: typeof input.subscription.cancel_at === "number" ? input.subscription.cancel_at * 1000 : null,
    canceledAt: typeof input.subscription.canceled_at === "number" ? input.subscription.canceled_at * 1000 : null,
    latestInvoiceId:
      typeof input.subscription.latest_invoice === "string"
        ? input.subscription.latest_invoice
        : input.subscription.latest_invoice?.id ?? null
  } satisfies NormalizedStripeSubscription;
}
