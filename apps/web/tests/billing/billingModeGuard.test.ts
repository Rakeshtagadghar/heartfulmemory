import { afterEach, describe, expect, it } from "vitest";
import { getBillingRuntimeConfig } from "../../lib/config/billingMode";

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.BILLING_MODE;
  delete process.env.STRIPE_SECRET_KEY_TEST;
  delete process.env.STRIPE_WEBHOOK_SECRET_TEST;
  delete process.env.STRIPE_PRICE_ID_PRO_TEST;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.STRIPE_PRICE_ID_PRO_MONTHLY;
  delete process.env.STRIPE_PRICE_ID_PRO_ANNUAL;
}

describe("billing mode runtime guard", () => {
  afterEach(() => {
    resetEnv();
  });

  it("requires test keys and price in BILLING_MODE=test", () => {
    process.env.BILLING_MODE = "test";
    process.env.STRIPE_SECRET_KEY_TEST = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET_TEST = "whsec_test_123";
    process.env.STRIPE_PRICE_ID_PRO_TEST = "price_test_123";

    const config = getBillingRuntimeConfig();

    expect(config.mode).toBe("test");
    expect(config.errors).toHaveLength(0);
    expect(config.stripeSecretKey).toBe("sk_test_123");
  });

  it("blocks live key usage in test mode", () => {
    process.env.BILLING_MODE = "test";
    process.env.STRIPE_SECRET_KEY_TEST = "sk_live_123";
    process.env.STRIPE_WEBHOOK_SECRET_TEST = "whsec_test_123";
    process.env.STRIPE_PRICE_ID_PRO_TEST = "price_test_123";

    const config = getBillingRuntimeConfig();

    expect(config.errors.some((error) => error.includes("live key"))).toBe(true);
  });

  it("blocks test key usage in live mode", () => {
    process.env.BILLING_MODE = "live";
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_live_123";
    process.env.STRIPE_PRICE_ID_PRO_MONTHLY = "price_live_123";

    const config = getBillingRuntimeConfig();

    expect(config.errors.some((error) => error.includes("test key"))).toBe(true);
  });
});
