import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return key.length > 0 ? key : null;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  return secret.length > 0 ? secret : null;
}

export function getStripeClient() {
  const secret = getStripeSecretKey();
  if (!secret) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(secret, {
      appInfo: {
        name: "memorioso-web",
        version: "sprint25"
      }
    });
  }
  return stripeClient;
}

