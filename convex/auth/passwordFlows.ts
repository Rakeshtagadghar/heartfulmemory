import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

type FlowPurpose = "password_reset" | "email_verification";

function isExpired(expiresAt: number, now: number) {
  return expiresAt <= now;
}

export const createFlowToken = mutationGeneric({
  args: {
    purpose: v.union(v.literal("password_reset"), v.literal("email_verification")),
    email: v.string(),
    tokenHash: v.string(),
    expiresAt: v.number(),
    authSubject: v.optional(v.union(v.string(), v.null())),
    requestIp: v.optional(v.union(v.string(), v.null())),
    userAgent: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("authFlowTokens")
      .withIndex("by_email_purpose", (q: any) => q.eq("email", args.email).eq("purpose", args.purpose))
      .collect();

    for (const token of existing) {
      if (typeof token.consumedAt === "number") continue;
      await ctx.db.patch(token._id, {
        consumedAt: now,
        invalidatedReason: "replaced",
        updatedAt: now
      });
    }

    await ctx.db.insert("authFlowTokens", {
      purpose: args.purpose,
      email: args.email,
      authSubject: args.authSubject ?? undefined,
      tokenHash: args.tokenHash,
      expiresAt: args.expiresAt,
      consumedAt: null,
      invalidatedReason: null,
      requestIp: args.requestIp ?? null,
      userAgent: args.userAgent ?? null,
      createdAt: now,
      updatedAt: now
    });

    return { ok: true as const };
  }
});

export const consumeFlowToken = mutationGeneric({
  args: {
    purpose: v.union(v.literal("password_reset"), v.literal("email_verification")),
    tokenHash: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const record = await ctx.db
      .query("authFlowTokens")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();

    if (!record) {
      return { ok: false as const, code: "invalid_token" as const };
    }

    if (record.purpose !== args.purpose) {
      return { ok: false as const, code: "invalid_token" as const };
    }

    if (typeof record.consumedAt === "number") {
      return { ok: false as const, code: "already_used" as const };
    }

    if (isExpired(record.expiresAt, now)) {
      await ctx.db.patch(record._id, {
        consumedAt: now,
        invalidatedReason: "expired",
        updatedAt: now
      });
      return { ok: false as const, code: "expired" as const };
    }

    await ctx.db.patch(record._id, {
      consumedAt: now,
      invalidatedReason: null,
      updatedAt: now
    });

    return {
      ok: true as const,
      purpose: record.purpose as FlowPurpose,
      email: record.email,
      authSubject: record.authSubject ?? null
    };
  }
});

export const cleanupExpiredFlowTokens = mutationGeneric({
  args: {
    now: v.optional(v.number()),
    batchSize: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    const batchSize = Math.min(Math.max(args.batchSize ?? 100, 1), 500);

    const expired = await ctx.db
      .query("authFlowTokens")
      .withIndex("by_expiresAt", (q) => q.lte("expiresAt", now))
      .take(batchSize);

    let removed = 0;
    for (const token of expired) {
      await ctx.db.delete(token._id);
      removed += 1;
    }

    return { ok: true as const, removed };
  }
});

export const getActiveFlowTokenCountByEmail = queryGeneric({
  args: {
    purpose: v.union(v.literal("password_reset"), v.literal("email_verification")),
    email: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const items = await ctx.db
      .query("authFlowTokens")
      .withIndex("by_email_purpose", (q: any) => q.eq("email", args.email).eq("purpose", args.purpose))
      .collect();

    const activeCount = items.filter(
      (item) => typeof item.consumedAt !== "number" && item.expiresAt > now
    ).length;

    return { activeCount };
  }
});
