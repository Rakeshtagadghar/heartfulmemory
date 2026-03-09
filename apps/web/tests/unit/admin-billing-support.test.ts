import { describe, expect, it } from "vitest";
import {
  deriveAdminBillingMode,
  deriveBillingDiagnosis,
  maskBillingReference,
} from "../../../../packages/shared/admin/billingSupport";

describe("maskBillingReference", () => {
  it("masks long provider identifiers", () => {
    expect(maskBillingReference("sub_1234567890abcdef")).toBe("sub_...abcdef");
  });

  it("returns null for empty values", () => {
    expect(maskBillingReference(null)).toBeNull();
    expect(maskBillingReference(undefined)).toBeNull();
  });
});

describe("deriveAdminBillingMode", () => {
  it("maps test runtime to sandbox", () => {
    expect(deriveAdminBillingMode({ mode: "test", billingModeIsTest: true })).toBe("sandbox");
  });

  it("maps live runtime to live", () => {
    expect(deriveAdminBillingMode({ mode: "live", billingModeIsTest: false })).toBe("live");
  });
});

describe("deriveBillingDiagnosis", () => {
  it("flags sandbox mode before other billing diagnoses", () => {
    expect(
      deriveBillingDiagnosis({
        billingMode: "sandbox",
        entitlementStatus: "active",
        subscriptionStatus: "active",
        paymentAttemptStatus: "succeeded",
        hasCustomerRecord: true,
        hasSubscriptionRecord: true,
      })
    ).toMatchObject({
      code: "sandbox_mode_confusion",
    });
  });

  it("flags stale entitlements after a successful payment", () => {
    expect(
      deriveBillingDiagnosis({
        billingMode: "live",
        entitlementStatus: "none",
        subscriptionStatus: "active",
        paymentAttemptStatus: "succeeded",
        hasCustomerRecord: true,
        hasSubscriptionRecord: true,
      })
    ).toMatchObject({
      code: "payment_succeeded_but_entitlement_missing",
    });
  });

  it("flags incomplete checkout state", () => {
    expect(
      deriveBillingDiagnosis({
        billingMode: "live",
        entitlementStatus: "none",
        subscriptionStatus: "incomplete",
        paymentAttemptStatus: "requires_action",
        hasCustomerRecord: true,
        hasSubscriptionRecord: true,
      })
    ).toMatchObject({
      code: "checkout_incomplete",
    });
  });
});
