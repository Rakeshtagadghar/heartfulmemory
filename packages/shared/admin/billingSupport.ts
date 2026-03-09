export const ADMIN_BILLING_ENTITLEMENT_STATUSES = [
  "none",
  "trial_active",
  "active",
  "grace_period",
  "expired",
  "manually_granted",
  "suspended",
] as const;
export type AdminBillingEntitlementStatus =
  (typeof ADMIN_BILLING_ENTITLEMENT_STATUSES)[number];

export const ADMIN_BILLING_MODES = ["sandbox", "live", "unknown"] as const;
export type AdminBillingMode = (typeof ADMIN_BILLING_MODES)[number];

export const ADMIN_BILLING_PAYMENT_ATTEMPT_STATUSES = [
  "not_attempted",
  "pending",
  "succeeded",
  "failed",
  "requires_action",
  "cancelled",
] as const;
export type AdminBillingPaymentAttemptStatus =
  (typeof ADMIN_BILLING_PAYMENT_ATTEMPT_STATUSES)[number];

export interface AdminBillingSummary {
  userId: string;
  planCode: string;
  planLabel: string;
  entitlementStatus: AdminBillingEntitlementStatus;
  subscriptionStatus: string;
  billingMode: AdminBillingMode;
  trialStatus: string | null;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  providerCustomerRefMasked: string | null;
  providerSubscriptionRefMasked: string | null;
  lastCheckoutStatus: string | null;
  lastPaymentStatus: AdminBillingPaymentAttemptStatus;
  lastBillingEventAt: number | null;
}

export interface AdminBillingDetail {
  userSummary: {
    userId: string;
    displayName: string | null;
    email: string | null;
  };
  planSummary: {
    planCode: string;
    planLabel: string;
    features: string[];
  };
  entitlements: {
    status: AdminBillingEntitlementStatus;
    canExportDigital: boolean;
    canExportHardcopy: boolean;
    exportsRemaining: number | null;
  };
  subscriptionSummary: {
    id: string | null;
    providerSubscriptionRefMasked: string | null;
    providerCustomerRefMasked: string | null;
    status: string;
    currentPeriodStart: number | null;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
    updatedAt: number | null;
  };
  checkoutHistorySummary: {
    lastCheckoutStatus: string | null;
    lastBillingEventAt: number | null;
  };
  paymentAttemptSummary: {
    status: AdminBillingPaymentAttemptStatus;
    latestInvoiceIdMasked: string | null;
  };
  sandboxOrLiveStatus: AdminBillingMode;
  supportFlags: {
    hasCustomerRecord: boolean;
    hasSubscriptionRecord: boolean;
    needsRecovery: boolean;
  };
  manualOverrideState: {
    active: boolean;
    expiresAt: number | null;
  } | null;
  recommendedSupportDiagnosis: {
    code: string;
    label: string;
    message: string;
    nextStep: string | null;
  } | null;
}

export interface AdminSubscriptionDetail {
  subscriptionId: string;
  userId: string;
  userDisplayName: string | null;
  userEmail: string | null;
  providerSubscriptionRefMasked: string | null;
  providerCustomerRefMasked: string | null;
  planCode: string;
  planLabel: string;
  status: string;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  mode: AdminBillingMode;
  latestInvoiceIdMasked: string | null;
  latestPaymentStatus: AdminBillingPaymentAttemptStatus;
  lastSyncedAt: number | null;
  entitlementProjection: {
    status: AdminBillingEntitlementStatus;
    canExportDigital: boolean;
    canExportHardcopy: boolean;
    exportsRemaining: number | null;
  };
  manualOverrideState: {
    active: boolean;
    expiresAt: number | null;
  } | null;
}

export type AdminBillingCoreDetail = Omit<
  AdminBillingDetail,
  "sandboxOrLiveStatus" | "recommendedSupportDiagnosis"
>;

export const ADMIN_BILLING_MANUAL_ENTITLEMENT_STATUSES = [
  "manually_granted",
  "suspended",
] as const;

export type AdminBillingManualEntitlementStatus =
  (typeof ADMIN_BILLING_MANUAL_ENTITLEMENT_STATUSES)[number];

export function maskBillingReference(
  value: string | null | undefined,
  visible = 6
): string | null {
  if (!value) return null;
  if (value.length <= visible) return value;
  return `${value.slice(0, 4)}...${value.slice(-Math.min(visible, value.length - 4))}`;
}

export function deriveAdminBillingMode(input: {
  mode?: string | null;
  billingModeIsTest?: boolean;
}): AdminBillingMode {
  if (input.billingModeIsTest || input.mode === "test" || input.mode === "sandbox") {
    return "sandbox";
  }
  if (input.mode === "live") return "live";
  return "unknown";
}

export function deriveEntitlementStatus(input: {
  planCode: string;
  subscriptionStatus: string | null | undefined;
  canExportDigital: boolean;
  currentPeriodEnd: number | null | undefined;
  manualOverrideStatus?: AdminBillingManualEntitlementStatus | null;
  nowMs?: number;
}): AdminBillingEntitlementStatus {
  if (input.manualOverrideStatus === "manually_granted") {
    return "manually_granted";
  }
  if (input.manualOverrideStatus === "suspended") {
    return "suspended";
  }

  const now = input.nowMs ?? Date.now();
  if (!input.canExportDigital) {
    if (input.subscriptionStatus === "trialing") return "trial_active";
    if (
      input.currentPeriodEnd &&
      input.currentPeriodEnd > 0 &&
      input.currentPeriodEnd < now
    ) {
      return "expired";
    }
    return "none";
  }

  if (input.subscriptionStatus === "trialing") return "trial_active";
  if (input.subscriptionStatus === "past_due") return "grace_period";
  if (input.subscriptionStatus === "active") return "active";
  return input.planCode === "pro" ? "active" : "none";
}

export function isAllowedAdminManualEntitlementStatus(
  value: string | null | undefined
): value is AdminBillingManualEntitlementStatus {
  return value === "manually_granted";
}

export function derivePaymentAttemptStatus(input: {
  subscriptionStatus: string | null | undefined;
  latestInvoiceId?: string | null;
}): AdminBillingPaymentAttemptStatus {
  if (!input.latestInvoiceId) return "not_attempted";
  if (input.subscriptionStatus === "past_due" || input.subscriptionStatus === "unpaid") {
    return "failed";
  }
  if (input.subscriptionStatus === "incomplete") return "requires_action";
  if (input.subscriptionStatus === "canceled") return "cancelled";
  if (input.subscriptionStatus === "active" || input.subscriptionStatus === "trialing") {
    return "succeeded";
  }
  return "pending";
}

export function deriveBillingDiagnosis(input: {
  billingMode: AdminBillingMode;
  entitlementStatus: AdminBillingEntitlementStatus;
  subscriptionStatus: string;
  paymentAttemptStatus: AdminBillingPaymentAttemptStatus;
  hasCustomerRecord: boolean;
  hasSubscriptionRecord: boolean;
}): AdminBillingDetail["recommendedSupportDiagnosis"] {
  if (input.billingMode === "sandbox") {
    return {
      code: "sandbox_mode_confusion",
      label: "Sandbox mode",
      message: "This account is operating in sandbox/test mode. No real payment should be expected.",
      nextStep: "Confirm the user understands this is a test billing environment.",
    };
  }

  if (
    input.paymentAttemptStatus === "succeeded" &&
    input.subscriptionStatus === "active" &&
    (input.entitlementStatus === "none" || input.entitlementStatus === "expired")
  ) {
    return {
      code: "payment_succeeded_but_entitlement_missing",
      label: "Entitlement may be stale",
      message:
        "Payment appears successful, but app access is not aligned with subscription state.",
      nextStep: "Check billing sync state and prepare a resync flow.",
    };
  }

  if (
    input.subscriptionStatus === "incomplete" ||
    input.paymentAttemptStatus === "requires_action"
  ) {
    return {
      code: "checkout_incomplete",
      label: "Checkout incomplete",
      message: "Checkout did not complete successfully. The user may need to retry payment.",
      nextStep: "Ask the user to retry checkout or complete required payment authentication.",
    };
  }

  if (
    input.entitlementStatus === "expired" &&
    (input.subscriptionStatus === "none" || input.subscriptionStatus === "canceled")
  ) {
    return {
      code: "trial_expired",
      label: "Trial expired",
      message: "Trial access has ended and no active paid subscription is present.",
      nextStep: "Direct the user to upgrade if they need export access.",
    };
  }

  if (!input.hasCustomerRecord && !input.hasSubscriptionRecord) {
    return {
      code: "no_billing_activity",
      label: "No billing activity",
      message: "No customer or subscription record is stored for this user.",
      nextStep: "Confirm whether the user has ever attempted checkout.",
    };
  }

  return null;
}
