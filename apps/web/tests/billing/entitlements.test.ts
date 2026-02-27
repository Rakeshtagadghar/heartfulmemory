import { describe, expect, it } from "vitest";
import { resolveBillingEntitlements } from "../../../../packages/shared/billing/entitlementRules";

describe("resolveBillingEntitlements", () => {
  it("enables digital and hardcopy export for active pro subscription", () => {
    const entitlements = resolveBillingEntitlements({
      planId: "pro",
      subscriptionStatus: "active",
      exportsUsedThisMonth: 10
    });

    expect(entitlements.canExportDigital).toBe(true);
    expect(entitlements.canExportHardcopy).toBe(true);
    expect(entitlements.exportsRemaining).toBe(40);
  });

  it("disables export for free users", () => {
    const entitlements = resolveBillingEntitlements({
      planId: "free",
      subscriptionStatus: "none"
    });

    expect(entitlements.canExportDigital).toBe(false);
    expect(entitlements.canExportHardcopy).toBe(false);
    expect(entitlements.exportsRemaining).toBe(0);
  });

  it("allows grace access for past_due when within grace period", () => {
    const nowMs = Date.UTC(2026, 1, 27, 12, 0, 0);
    const periodEnd = nowMs - 1000;

    const entitlements = resolveBillingEntitlements({
      planId: "pro",
      subscriptionStatus: "past_due",
      currentPeriodEnd: periodEnd,
      gracePeriodDays: 1,
      nowMs,
      exportsUsedThisMonth: 0
    });

    expect(entitlements.canExportDigital).toBe(true);
    expect(entitlements.canExportHardcopy).toBe(true);
  });

  it("disables export for past_due when grace period elapsed", () => {
    const nowMs = Date.UTC(2026, 1, 27, 12, 0, 0);
    const periodEnd = nowMs - 3 * 24 * 60 * 60 * 1000;

    const entitlements = resolveBillingEntitlements({
      planId: "pro",
      subscriptionStatus: "past_due",
      currentPeriodEnd: periodEnd,
      gracePeriodDays: 1,
      nowMs
    });

    expect(entitlements.canExportDigital).toBe(false);
    expect(entitlements.canExportHardcopy).toBe(false);
  });
});
