import {
  BILLING_PLAN_CATALOG,
  DEFAULT_BILLING_PLAN_ID,
  normalizeBillingPlanId,
  normalizeSubscriptionStatus,
  type BillingEntitlements,
  type BillingPlanId,
  type BillingSubscriptionStatus
} from "./entitlements";

export type ResolveEntitlementsInput = {
  planId?: string | null;
  subscriptionStatus?: string | null;
  exportsUsedThisMonth?: number | null;
  currentPeriodEnd?: number | null;
  gracePeriodDays?: number;
  nowMs?: number;
};

export function isSubscriptionActiveLike(status: BillingSubscriptionStatus) {
  return status === "active" || status === "trialing";
}

export function hasPastDueGraceAccess(input: {
  status: BillingSubscriptionStatus;
  gracePeriodDays?: number;
  nowMs?: number;
  currentPeriodEnd?: number | null;
}) {
  if (input.status !== "past_due") return false;
  const graceDays = Math.max(0, input.gracePeriodDays ?? 0);
  if (graceDays <= 0) return false;
  if (!input.currentPeriodEnd || input.currentPeriodEnd <= 0) return false;
  const now = input.nowMs ?? Date.now();
  const graceUntil = input.currentPeriodEnd + graceDays * 24 * 60 * 60 * 1000;
  return now <= graceUntil;
}

export function resolveBillingEntitlements(input: ResolveEntitlementsInput): BillingEntitlements {
  const planId: BillingPlanId = normalizeBillingPlanId(input.planId ?? DEFAULT_BILLING_PLAN_ID);
  const subscriptionStatus = normalizeSubscriptionStatus(input.subscriptionStatus);
  const plan = BILLING_PLAN_CATALOG[planId];
  const exportsUsed = Math.max(0, input.exportsUsedThisMonth ?? 0);
  const hasPaidAccess =
    planId !== "free" &&
    (isSubscriptionActiveLike(subscriptionStatus) ||
      hasPastDueGraceAccess({
        status: subscriptionStatus,
        gracePeriodDays: input.gracePeriodDays,
        currentPeriodEnd: input.currentPeriodEnd,
        nowMs: input.nowMs
      }));

  if (!hasPaidAccess) {
    return {
      planId,
      subscriptionStatus,
      canExportDigital: false,
      canExportHardcopy: false,
      exportsRemaining: 0
    };
  }

  const monthlyLimit = plan.limits.exportsPerMonth;
  return {
    planId,
    subscriptionStatus,
    canExportDigital: plan.limits.canExportDigital,
    canExportHardcopy: plan.limits.canExportHardcopy,
    exportsRemaining: monthlyLimit === null ? null : Math.max(0, monthlyLimit - exportsUsed)
  };
}

export function canExportTarget(
  entitlements: BillingEntitlements,
  target: "DIGITAL_PDF" | "HARDCOPY_PRINT_PDF"
) {
  if (target === "HARDCOPY_PRINT_PDF") return entitlements.canExportHardcopy;
  return entitlements.canExportDigital;
}

