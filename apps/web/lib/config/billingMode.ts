export type BillingMode = "test" | "live";

export type BillingRuntimeConfig = {
  mode: BillingMode;
  stripeSecretKey: string | null;
  stripeWebhookSecret: string | null;
  stripePriceIdProTest: string | null;
  stripePriceIdProMonthly: string | null;
  stripePriceIdProAnnual: string | null;
  stripePortalConfigIdTest: string | null;
  stripePortalConfigIdLive: string | null;
  errors: string[];
};

function readEnv(name: string) {
  const value = process.env[name]?.trim() ?? "";
  return value.length > 0 ? value : null;
}

export function resolveBillingMode(): BillingMode {
  const raw = (process.env.BILLING_MODE ?? "test").trim().toLowerCase();
  return raw === "live" ? "live" : "test";
}

function isTestSecret(key: string | null) {
  if (!key) return false;
  return key.startsWith("sk_test_");
}

function isLiveSecret(key: string | null) {
  if (!key) return false;
  return key.startsWith("sk_live_");
}

export function getBillingRuntimeConfig(): BillingRuntimeConfig {
  const mode = resolveBillingMode();
  const stripeSecretKeyTest = readEnv("STRIPE_SECRET_KEY_TEST");
  const stripeWebhookSecretTest = readEnv("STRIPE_WEBHOOK_SECRET_TEST");
  const stripePriceIdProTest = readEnv("STRIPE_PRICE_ID_PRO_TEST");
  const stripePortalConfigIdTest = readEnv("STRIPE_CUSTOMER_PORTAL_CONFIG_ID_TEST");

  const stripeSecretKeyLive = readEnv("STRIPE_SECRET_KEY");
  const stripeWebhookSecretLive = readEnv("STRIPE_WEBHOOK_SECRET");
  const stripePriceIdProMonthly = readEnv("STRIPE_PRICE_ID_PRO_MONTHLY");
  const stripePriceIdProAnnual = readEnv("STRIPE_PRICE_ID_PRO_ANNUAL");
  const stripePortalConfigIdLive = readEnv("STRIPE_CUSTOMER_PORTAL_CONFIG_ID");

  const errors: string[] = [];

  if (mode === "test") {
    if (!stripeSecretKeyTest) errors.push("STRIPE_SECRET_KEY_TEST is required when BILLING_MODE=test.");
    if (!stripeWebhookSecretTest) errors.push("STRIPE_WEBHOOK_SECRET_TEST is required when BILLING_MODE=test.");
    if (!stripePriceIdProTest) errors.push("STRIPE_PRICE_ID_PRO_TEST is required when BILLING_MODE=test.");
    if (isLiveSecret(stripeSecretKeyTest)) {
      errors.push("STRIPE_SECRET_KEY_TEST appears to be a live key while BILLING_MODE=test.");
    }
    if (!stripeSecretKeyTest && stripeSecretKeyLive) {
      errors.push("BILLING_MODE=test cannot fallback to STRIPE_SECRET_KEY. Configure *_TEST variables.");
    }
  } else {
    if (!stripeSecretKeyLive) errors.push("STRIPE_SECRET_KEY is required when BILLING_MODE=live.");
    if (!stripeWebhookSecretLive) errors.push("STRIPE_WEBHOOK_SECRET is required when BILLING_MODE=live.");
    if (!stripePriceIdProMonthly && !stripePriceIdProAnnual) {
      errors.push("At least one live price ID is required when BILLING_MODE=live.");
    }
    if (isTestSecret(stripeSecretKeyLive)) {
      errors.push("STRIPE_SECRET_KEY appears to be a test key while BILLING_MODE=live.");
    }
  }

  return {
    mode,
    stripeSecretKey: mode === "test" ? stripeSecretKeyTest : stripeSecretKeyLive,
    stripeWebhookSecret: mode === "test" ? stripeWebhookSecretTest : stripeWebhookSecretLive,
    stripePriceIdProTest,
    stripePriceIdProMonthly,
    stripePriceIdProAnnual,
    stripePortalConfigIdTest,
    stripePortalConfigIdLive,
    errors
  };
}

