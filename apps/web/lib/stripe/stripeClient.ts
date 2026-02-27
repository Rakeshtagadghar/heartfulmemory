import Stripe from "stripe";
import { getBillingRuntimeConfig } from "../config/billingMode";
import { getStripeClientForBilling, getStripeWebhookSecretForBilling } from "./stripeClientFactory";

export function getStripeSecretKey() {
  return getBillingRuntimeConfig().stripeSecretKey;
}

export function getStripeWebhookSecret() {
  return getStripeWebhookSecretForBilling();
}

export function getStripeClient() {
  const result = getStripeClientForBilling();
  if (!result.ok) return null;
  return result.stripe as Stripe;
}
