import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import { BILLING_PLAN_CATALOG } from "../packages/shared/billing/entitlements";
import {
  type AdminBillingCoreDetail,
  type AdminSubscriptionDetail,
  deriveEntitlementStatus,
  derivePaymentAttemptStatus,
  maskBillingReference,
} from "../packages/shared/admin/billingSupport";
import { resolveBillingEntitlements } from "../packages/shared/billing/entitlementRules";
import { getPdfExportUsageForPeriod, resolveQuotaPeriodForUser } from "./exportUsage";

type AdminSubscriptionCoreDetail = Omit<AdminSubscriptionDetail, "mode">;

function isManualOverrideActive(
  override: {
    revokedAt?: number | null;
    expiresAt?: number | null;
  } | null,
  nowMs = Date.now()
) {
  if (!override) return false;
  if (override.revokedAt) return false;
  if (override.expiresAt && override.expiresAt <= nowMs) return false;
  return true;
}

function applyManualOverride(
  entitlements: ReturnType<typeof resolveBillingEntitlements>,
  override: {
    entitlementStatus: "manually_granted" | "suspended";
    revokedAt?: number | null;
    expiresAt?: number | null;
  } | null
) {
  if (!isManualOverrideActive(override)) return entitlements;
  if (override?.entitlementStatus === "suspended") {
    return {
      ...entitlements,
      canExportDigital: false,
      canExportHardcopy: false,
      exportsRemaining: 0,
    };
  }

  return {
    planId: "pro" as const,
    subscriptionStatus: entitlements.subscriptionStatus,
    canExportDigital: true,
    canExportHardcopy: true,
    exportsRemaining: null,
  };
}

async function getLatestManualOverrideByUserId(ctx: { db: any }, userId: string) {
  const overrides = await ctx.db
    .query("billingManualEntitlements")
    .withIndex("by_userId_createdAt", (q: any) => q.eq("userId", userId))
    .order("desc")
    .take(5);
  return overrides[0] ?? null;
}

export const getUserBillingCore = queryGeneric({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<AdminBillingCoreDetail | null> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();
    if (!user) return null;

    const customer = await ctx.db
      .query("billingCustomers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    const subscriptions = await ctx.db
      .query("billingSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const subscription =
      subscriptions.sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
    const manualOverride = await getLatestManualOverrideByUserId(ctx, args.userId);
    const quotaPeriod = await resolveQuotaPeriodForUser(ctx, args.userId);
    const exportsUsedThisMonth = await getPdfExportUsageForPeriod(
      ctx,
      args.userId,
      quotaPeriod.periodStart
    );
    const entitlements = applyManualOverride(resolveBillingEntitlements({
      planId: subscription?.planId ?? "free",
      subscriptionStatus: subscription?.status ?? "none",
      exportsUsedThisMonth,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      gracePeriodDays: 0,
    }), manualOverride);

    const webhookEvents = await ctx.db.query("billingWebhookEvents").collect();
    const matchingEvent =
      webhookEvents
        .filter((event) => event.subscriptionId === subscription?.stripeSubscriptionId)
        .sort((left, right) => right.processedAt - left.processedAt)[0] ?? null;

    const entitlementStatus = deriveEntitlementStatus({
      planCode: entitlements.planId,
      subscriptionStatus: entitlements.subscriptionStatus,
      canExportDigital: entitlements.canExportDigital,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      manualOverrideStatus:
        isManualOverrideActive(manualOverride) ? manualOverride?.entitlementStatus ?? null : null,
    });
    const paymentAttemptStatus = derivePaymentAttemptStatus({
      subscriptionStatus: subscription?.status ?? "none",
      latestInvoiceId: subscription?.latestInvoiceId ?? null,
    });
    const plan = BILLING_PLAN_CATALOG[entitlements.planId];

    return {
      userSummary: {
        userId: user.authSubject,
        displayName: user.display_name ?? null,
        email: user.primaryEmail ?? user.email ?? null,
      },
      planSummary: {
        planCode: entitlements.planId,
        planLabel: plan.id === "pro" ? "Pro" : "Free",
        features: plan.features,
      },
      entitlements: {
        status: entitlementStatus,
        canExportDigital: entitlements.canExportDigital,
        canExportHardcopy: entitlements.canExportHardcopy,
        exportsRemaining: entitlements.exportsRemaining,
      },
      subscriptionSummary: {
        id: subscription?._id ? String(subscription._id) : null,
        providerSubscriptionRefMasked: maskBillingReference(subscription?.stripeSubscriptionId ?? null),
        providerCustomerRefMasked: maskBillingReference(customer?.stripeCustomerId ?? null),
        status: subscription?.status ?? "none",
        currentPeriodStart: subscription?.currentPeriodStart ?? null,
        currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        updatedAt: subscription?.updatedAt ?? null,
      },
      checkoutHistorySummary: {
        lastCheckoutStatus:
          subscription?.status === "incomplete"
            ? "Checkout incomplete"
            : subscription?.status === "active" || subscription?.status === "trialing"
              ? "Checkout completed"
              : customer
                ? "Customer created"
                : null,
        lastBillingEventAt: matchingEvent?.processedAt ?? subscription?.updatedAt ?? customer?.updatedAt ?? null,
      },
      paymentAttemptSummary: {
        status: paymentAttemptStatus,
        latestInvoiceIdMasked: maskBillingReference(subscription?.latestInvoiceId ?? null),
      },
      supportFlags: {
        hasCustomerRecord: Boolean(customer),
        hasSubscriptionRecord: Boolean(subscription),
        needsRecovery: Boolean(customer) && (!subscription || subscription.status === "incomplete"),
      },
      manualOverrideState: manualOverride
        ? {
            active: isManualOverrideActive(manualOverride),
            expiresAt: manualOverride.expiresAt ?? null,
          }
        : null,
    };
  },
});

export const getSubscriptionDetailCore = queryGeneric({
  args: { subscriptionId: v.string() },
  handler: async (ctx, args): Promise<AdminSubscriptionCoreDetail | null> => {
    const subscription = await ctx.db.get(args.subscriptionId as never);
    if (!subscription) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", subscription.userId))
      .unique();
    const customer = await ctx.db
      .query("billingCustomers")
      .withIndex("by_userId", (q) => q.eq("userId", subscription.userId))
      .first();
    const manualOverride = await getLatestManualOverrideByUserId(ctx, subscription.userId);
    const quotaPeriod = await resolveQuotaPeriodForUser(ctx, subscription.userId);
    const exportsUsedThisMonth = await getPdfExportUsageForPeriod(
      ctx,
      subscription.userId,
      quotaPeriod.periodStart
    );
    const entitlements = applyManualOverride(resolveBillingEntitlements({
      planId: subscription.planId,
      subscriptionStatus: subscription.status,
      exportsUsedThisMonth,
      currentPeriodEnd: subscription.currentPeriodEnd ?? null,
      gracePeriodDays: 0,
    }), manualOverride);
    const plan = BILLING_PLAN_CATALOG[entitlements.planId];
    const paymentStatus = derivePaymentAttemptStatus({
      subscriptionStatus: subscription.status,
      latestInvoiceId: subscription.latestInvoiceId ?? null,
    });

    return {
      subscriptionId: String(subscription._id),
      userId: subscription.userId,
      userDisplayName: user?.display_name ?? null,
      userEmail: user?.primaryEmail ?? user?.email ?? null,
      providerSubscriptionRefMasked: maskBillingReference(subscription.stripeSubscriptionId),
      providerCustomerRefMasked: maskBillingReference(customer?.stripeCustomerId ?? null),
      planCode: entitlements.planId,
      planLabel: plan.id === "pro" ? "Pro" : "Free",
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart ?? null,
      currentPeriodEnd: subscription.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
      latestInvoiceIdMasked: maskBillingReference(subscription.latestInvoiceId ?? null),
      latestPaymentStatus: paymentStatus,
      lastSyncedAt: subscription.updatedAt ?? null,
      entitlementProjection: {
        status: deriveEntitlementStatus({
          planCode: entitlements.planId,
          subscriptionStatus: entitlements.subscriptionStatus,
          canExportDigital: entitlements.canExportDigital,
          currentPeriodEnd: subscription.currentPeriodEnd ?? null,
          manualOverrideStatus:
            isManualOverrideActive(manualOverride)
              ? manualOverride?.entitlementStatus ?? null
              : null,
        }),
        canExportDigital: entitlements.canExportDigital,
        canExportHardcopy: entitlements.canExportHardcopy,
        exportsRemaining: entitlements.exportsRemaining,
      },
      manualOverrideState: manualOverride
        ? {
            active: isManualOverrideActive(manualOverride),
            expiresAt: manualOverride.expiresAt ?? null,
          }
        : null,
    };
  },
});
