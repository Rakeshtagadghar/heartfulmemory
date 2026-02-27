import Stripe from "stripe";
import { getBillingRuntimeConfig } from "../config/billingMode";

const stripeClientsByKey = new Map<string, Stripe>();

export function getStripeClientForBilling() {
  const billing = getBillingRuntimeConfig();
  if (billing.errors.length > 0) {
    return {
      ok: false as const,
      error: billing.errors.join(" "),
      billing
    };
  }
  if (!billing.stripeSecretKey) {
    return {
      ok: false as const,
      error: "Stripe secret key is not configured for current billing mode.",
      billing
    };
  }

  const cacheKey = `${billing.mode}:${billing.stripeSecretKey}`;
  let stripe = stripeClientsByKey.get(cacheKey);
  if (!stripe) {
    stripe = new Stripe(billing.stripeSecretKey, {
      appInfo: {
        name: "memorioso-web",
        version: "sprint26"
      }
    });
    stripeClientsByKey.set(cacheKey, stripe);
  }

  return {
    ok: true as const,
    stripe,
    billing
  };
}

export function getStripeWebhookSecretForBilling() {
  const billing = getBillingRuntimeConfig();
  if (billing.errors.length > 0) return null;
  return billing.stripeWebhookSecret;
}

