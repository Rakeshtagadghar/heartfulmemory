import { describe, expect, it } from "vitest";
import { resolveQuotaPeriod } from "../../../../lib/billing/quota";

describe("resolveQuotaPeriod", () => {
  it("uses Stripe subscription period for active subscriptions", () => {
    const periodStart = Date.UTC(2026, 1, 1, 0, 0, 0, 0);
    const periodEnd = Date.UTC(2026, 2, 1, 0, 0, 0, 0);

    const quotaPeriod = resolveQuotaPeriod({
      subscriptionStatus: "active",
      subscriptionCurrentPeriodStart: periodStart,
      subscriptionCurrentPeriodEnd: periodEnd
    });

    expect(quotaPeriod).toEqual({
      periodStart,
      periodEnd,
      periodSource: "subscription"
    });
  });

  it("falls back to UTC calendar month without eligible subscription period", () => {
    const nowMs = Date.UTC(2026, 1, 27, 12, 0, 0, 0);

    const quotaPeriod = resolveQuotaPeriod({
      subscriptionStatus: "none",
      nowMs
    });

    expect(quotaPeriod.periodSource).toBe("calendar");
    expect(quotaPeriod.periodStart).toBe(Date.UTC(2026, 1, 1, 0, 0, 0, 0));
    expect(quotaPeriod.periodEnd).toBe(Date.UTC(2026, 2, 1, 0, 0, 0, 0));
  });

  it("falls back to calendar period when period bounds are invalid", () => {
    const nowMs = Date.UTC(2026, 1, 27, 12, 0, 0, 0);

    const quotaPeriod = resolveQuotaPeriod({
      subscriptionStatus: "active",
      subscriptionCurrentPeriodStart: Date.UTC(2026, 2, 1, 0, 0, 0, 0),
      subscriptionCurrentPeriodEnd: Date.UTC(2026, 1, 1, 0, 0, 0, 0),
      nowMs
    });

    expect(quotaPeriod.periodSource).toBe("calendar");
    expect(quotaPeriod.periodStart).toBe(Date.UTC(2026, 1, 1, 0, 0, 0, 0));
    expect(quotaPeriod.periodEnd).toBe(Date.UTC(2026, 2, 1, 0, 0, 0, 0));
  });
});
