import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import { BILLING_PLAN_CATALOG } from "../packages/shared/billing/entitlements";
import {
  type AdminBillingCoreDetail,
  deriveEntitlementStatus,
  derivePaymentAttemptStatus,
  maskBillingReference,
} from "../packages/shared/admin/billingSupport";
import { resolveBillingEntitlements } from "../packages/shared/billing/entitlementRules";
import { getPdfExportUsageForPeriod, resolveQuotaPeriodForUser } from "./exportUsage";

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
    const quotaPeriod = await resolveQuotaPeriodForUser(ctx, args.userId);
    const exportsUsedThisMonth = await getPdfExportUsageForPeriod(
      ctx,
      args.userId,
      quotaPeriod.periodStart
    );
    const entitlements = resolveBillingEntitlements({
      planId: subscription?.planId ?? "free",
      subscriptionStatus: subscription?.status ?? "none",
      exportsUsedThisMonth,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      gracePeriodDays: 0,
    });

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
      manualOverrideState: null,
    };
  },
});
