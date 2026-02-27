export type BillingPlanId = "free" | "pro";

export type BillingSubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

export type BillingPlanDefinition = {
  id: BillingPlanId;
  features: string[];
  limits: {
    exportsPerMonth: number | null;
    canExportDigital: boolean;
    canExportHardcopy: boolean;
  };
};

export type BillingEntitlements = {
  planId: BillingPlanId;
  subscriptionStatus: BillingSubscriptionStatus;
  canExportDigital: boolean;
  canExportHardcopy: boolean;
  exportsRemaining: number | null;
};

export const BILLING_PLAN_CATALOG: Record<BillingPlanId, BillingPlanDefinition> = {
  free: {
    id: "free",
    features: ["Create storybooks", "Generate drafts", "Studio editing"],
    limits: {
      exportsPerMonth: 0,
      canExportDigital: false,
      canExportHardcopy: false
    }
  },
  pro: {
    id: "pro",
    features: ["Digital PDF export", "Hardcopy PDF export", "100 exports per month"],
    limits: {
      exportsPerMonth: 100,
      canExportDigital: true,
      canExportHardcopy: true
    }
  }
};

export const DEFAULT_BILLING_PLAN_ID: BillingPlanId = "free";

export function normalizeBillingPlanId(value: string | null | undefined): BillingPlanId {
  if (value === "pro") return "pro";
  return "free";
}

export function normalizeSubscriptionStatus(
  value: string | null | undefined
): BillingSubscriptionStatus {
  switch (value) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "incomplete":
      return value;
    default:
      return "none";
  }
}
