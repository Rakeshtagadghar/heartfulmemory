import { mutationGeneric, queryGeneric, type GenericMutationCtx, type GenericQueryCtx } from "convex/server";
import { v } from "convex/values";
import { requireUser } from "./authz";
import { resolveBillingEntitlements } from "../packages/shared/billing/entitlementRules";
import { resolveQuotaPeriod } from "../lib/billing/quota";
import type { DataModel } from "./_generated/dataModel";

type Ctx = GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>;

async function getLatestSubscriptionByUserId(ctx: Ctx, userId: string) {
  const rows = await ctx.db
    .query("billingSubscriptions")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect();
  return rows.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
}

export async function resolveQuotaPeriodForUser(ctx: Ctx, userId: string, nowMs = Date.now()) {
  const subscription = await getLatestSubscriptionByUserId(ctx, userId);
  return {
    ...resolveQuotaPeriod({
      subscriptionStatus: subscription?.status,
      subscriptionCurrentPeriodStart: subscription?.currentPeriodStart ?? null,
      subscriptionCurrentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      nowMs
    }),
    subscription
  };
}

export async function getPdfExportUsageForPeriod(ctx: Ctx, userId: string, periodStart: number) {
  const row = await ctx.db
    .query("exportUsage")
    .withIndex("by_userId_periodStart", (q: any) => q.eq("userId", userId).eq("periodStart", periodStart))
    .first();
  return row?.countPdfExports ?? 0;
}

export const getRemainingForViewer = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const quota = await resolveQuotaPeriodForUser(ctx, viewer.subject);
    const used = await getPdfExportUsageForPeriod(ctx, viewer.subject, quota.periodStart);

    const entitlements = resolveBillingEntitlements({
      planId: quota.subscription?.planId ?? "free",
      subscriptionStatus: quota.subscription?.status ?? "none",
      exportsUsedThisMonth: used,
      currentPeriodEnd: quota.subscription?.currentPeriodEnd ?? quota.periodEnd
    });

    return {
      used,
      remaining: entitlements.exportsRemaining ?? null,
      periodStart: quota.periodStart,
      periodEnd: quota.periodEnd,
      periodSource: quota.periodSource,
      entitlements
    };
  }
});

export const incrementUsageForViewer = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    incrementBy: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const incrementBy = Math.max(1, Math.floor(args.incrementBy ?? 1));
    const quota = await resolveQuotaPeriodForUser(ctx, viewer.subject);
    const now = Date.now();
    const existing = await ctx.db
      .query("exportUsage")
      .withIndex("by_userId_periodStart", (q: any) => q.eq("userId", viewer.subject).eq("periodStart", quota.periodStart))
      .first();

    if (existing) {
      const nextCount = Math.max(0, existing.countPdfExports + incrementBy);
      await ctx.db.patch(existing._id, {
        countPdfExports: nextCount,
        periodEnd: quota.periodEnd,
        updatedAt: now
      });
      return { used: nextCount, periodStart: quota.periodStart, periodEnd: quota.periodEnd };
    }

    await ctx.db.insert("exportUsage", {
      userId: viewer.subject,
      periodStart: quota.periodStart,
      periodEnd: quota.periodEnd,
      countPdfExports: incrementBy,
      updatedAt: now
    });
    return { used: incrementBy, periodStart: quota.periodStart, periodEnd: quota.periodEnd };
  }
});
