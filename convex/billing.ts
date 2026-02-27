import { mutationGeneric, queryGeneric } from "convex/server";
import { internalMutation, internalQuery, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./authz";
import { resolveBillingEntitlements } from "../packages/shared/billing/entitlementRules";
import { getPdfExportUsageForPeriod, resolveQuotaPeriodForUser } from "./exportUsage";

type Ctx = MutationCtx | QueryCtx;
type BillingCustomerRow = {
  _id: unknown;
  userId: string;
  email?: string | null;
  stripeCustomerId: string;
  createdAt: number;
  updatedAt: number;
} | null;
type BillingSubscriptionRow = {
  _id: unknown;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: string;
  status: string;
  currentPeriodStart?: number | null;
  currentPeriodEnd?: number | null;
  cancelAtPeriodEnd: boolean;
  latestInvoiceId?: string | null;
  updatedAt: number;
} | null;

const subscriptionStatusValidator = v.union(
  v.literal("trialing"),
  v.literal("active"),
  v.literal("past_due"),
  v.literal("canceled"),
  v.literal("unpaid"),
  v.literal("incomplete")
);

async function getCustomerByUserId(ctx: Ctx, userId: string) {
  return await ctx.db
    .query("billingCustomers")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
}

async function getLatestSubscriptionByUserId(ctx: Ctx, userId: string) {
  const rows = await ctx.db
    .query("billingSubscriptions")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  return rows.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
}

function toCustomerDto(row: BillingCustomerRow) {
  if (!row) return null;
  return {
    id: String(row._id),
    userId: row.userId,
    email: row.email ?? null,
    stripeCustomerId: row.stripeCustomerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function toSubscriptionDto(row: BillingSubscriptionRow) {
  if (!row) return null;
  return {
    id: String(row._id),
    userId: row.userId,
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    planId: row.planId,
    status: row.status,
    currentPeriodStart: row.currentPeriodStart ?? null,
    currentPeriodEnd: row.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    latestInvoiceId: row.latestInvoiceId ?? null,
    updatedAt: row.updatedAt
  };
}

async function upsertCustomerRow(
  ctx: MutationCtx,
  args: { userId: string; stripeCustomerId: string; email?: string | null }
) {
  const now = Date.now();
  const byUser = await ctx.db
    .query("billingCustomers")
    .withIndex("by_userId", (q) => q.eq("userId", args.userId))
    .first();

  if (byUser) {
    await ctx.db.patch(byUser._id, {
      stripeCustomerId: args.stripeCustomerId,
      email: args.email ?? byUser.email ?? null,
      updatedAt: now
    });
    return await ctx.db.get(byUser._id);
  }

  const byStripe = await ctx.db
    .query("billingCustomers")
    .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
    .first();

  if (byStripe) {
    await ctx.db.patch(byStripe._id, {
      userId: args.userId,
      email: args.email ?? byStripe.email ?? null,
      updatedAt: now
    });
    return await ctx.db.get(byStripe._id);
  }

  const inserted = await ctx.db.insert("billingCustomers", {
    userId: args.userId,
    email: args.email ?? null,
    stripeCustomerId: args.stripeCustomerId,
    createdAt: now,
    updatedAt: now
  });
  return await ctx.db.get(inserted);
}

export const getCustomerForViewer = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    return toCustomerDto(await getCustomerByUserId(ctx, viewer.subject));
  }
});

export const getSubscriptionForViewer = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    return toSubscriptionDto(await getLatestSubscriptionByUserId(ctx, viewer.subject));
  }
});

export const getEntitlementsForViewer = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    exportsUsedThisMonth: v.optional(v.number()),
    gracePeriodDays: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const [customer, subscription] = await Promise.all([
      getCustomerByUserId(ctx, viewer.subject),
      getLatestSubscriptionByUserId(ctx, viewer.subject)
    ]);
    const quotaPeriod = await resolveQuotaPeriodForUser(ctx, viewer.subject);
    const resolvedExportsUsed =
      typeof args.exportsUsedThisMonth === "number"
        ? Math.max(0, args.exportsUsedThisMonth)
        : await getPdfExportUsageForPeriod(ctx, viewer.subject, quotaPeriod.periodStart);

    const entitlements = resolveBillingEntitlements({
      planId: subscription?.planId ?? "free",
      subscriptionStatus: subscription?.status ?? "none",
      exportsUsedThisMonth: resolvedExportsUsed,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      gracePeriodDays: args.gracePeriodDays ?? 0
    });

    return {
      entitlements,
      customer: toCustomerDto(customer),
      subscription: toSubscriptionDto(subscription),
      usage: {
        used: resolvedExportsUsed,
        periodStart: quotaPeriod.periodStart,
        periodEnd: quotaPeriod.periodEnd,
        periodSource: quotaPeriod.periodSource
      }
    };
  }
});

export const upsertCustomerForViewer = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    stripeCustomerId: v.string(),
    email: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const row = await upsertCustomerRow(ctx, {
      userId: viewer.subject,
      stripeCustomerId: args.stripeCustomerId,
      email: args.email ?? null
    });
    return { ok: true as const, customer: toCustomerDto(row) };
  }
});

export const getCustomerByUserIdInternal = internalQuery({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    return toCustomerDto(await getCustomerByUserId(ctx, args.userId));
  }
});

export const getCustomerByStripeCustomerIdInternal = internalQuery({
  args: {
    stripeCustomerId: v.string()
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("billingCustomers")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();
    return toCustomerDto(row);
  }
});

export const upsertCustomerFromStripeInternal = internalMutation({
  args: {
    userId: v.string(),
    stripeCustomerId: v.string(),
    email: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    const row = await upsertCustomerRow(ctx, {
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId,
      email: args.email ?? null
    });
    return { ok: true as const, customer: toCustomerDto(row) };
  }
});

export const upsertSubscriptionFromStripeInternal = internalMutation({
  args: {
    stripeEventId: v.optional(v.string()),
    stripeEventType: v.optional(v.string()),
    userId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    planId: v.string(),
    status: subscriptionStatusValidator,
    currentPeriodStart: v.optional(v.union(v.number(), v.null())),
    currentPeriodEnd: v.optional(v.union(v.number(), v.null())),
    cancelAtPeriodEnd: v.boolean(),
    latestInvoiceId: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    if (args.stripeEventId) {
      const seen = await ctx.db
        .query("billingWebhookEvents")
        .withIndex("by_stripeEventId", (q) => q.eq("stripeEventId", args.stripeEventId!))
        .first();
      if (seen) {
        const existing = await ctx.db
          .query("billingSubscriptions")
          .withIndex("by_stripeSubscriptionId", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
          .first();
        return {
          ok: true as const,
          deduped: true as const,
          subscription: toSubscriptionDto(existing)
        };
      }
    }

    await upsertCustomerRow(ctx, {
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId
    });

    const now = Date.now();
    const existing = await ctx.db
      .query("billingSubscriptions")
      .withIndex("by_stripeSubscriptionId", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();

    let row;
    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: args.userId,
        stripeCustomerId: args.stripeCustomerId,
        planId: args.planId,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart ?? null,
        currentPeriodEnd: args.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        latestInvoiceId: args.latestInvoiceId ?? null,
        updatedAt: now
      });
      row = await ctx.db.get(existing._id);
    } else {
      const rowId = await ctx.db.insert("billingSubscriptions", {
        userId: args.userId,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        planId: args.planId,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart ?? null,
        currentPeriodEnd: args.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        latestInvoiceId: args.latestInvoiceId ?? null,
        updatedAt: now
      });
      row = await ctx.db.get(rowId);
    }

    if (args.stripeEventId) {
      await ctx.db.insert("billingWebhookEvents", {
        stripeEventId: args.stripeEventId,
        eventType: args.stripeEventType ?? "unknown",
        processedAt: now,
        subscriptionId: args.stripeSubscriptionId
      });
    }

    return {
      ok: true as const,
      deduped: false as const,
      subscription: toSubscriptionDto(row)
    };
  }
});
