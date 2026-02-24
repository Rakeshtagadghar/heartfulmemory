import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

function toProfileRecord(userId: string, user: {
  display_name?: string;
  email?: string;
  onboarding_completed: boolean;
  onboarding_goal?: string;
  marketing_consent?: boolean;
  locale?: string;
  timezone?: string;
  createdAt: number;
}) {
  return {
    id: userId,
    display_name: user.display_name ?? null,
    email: user.email ?? null,
    onboarding_completed: user.onboarding_completed,
    onboarding_goal: user.onboarding_goal ?? null,
    marketing_consent: user.marketing_consent ?? null,
    locale: user.locale ?? null,
    timezone: user.timezone ?? null,
    created_at: new Date(user.createdAt).toISOString()
  };
}

export const getCurrentUser = queryGeneric({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();
    if (!user) return null;
    return toProfileRecord(args.userId, user);
  }
});

export const upsertCurrentUser = mutationGeneric({
  args: {
    userId: v.string(),
    email: v.optional(v.union(v.string(), v.null())),
    displayName: v.optional(v.union(v.string(), v.null())),
    locale: v.optional(v.union(v.string(), v.null())),
    timezone: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email ?? existing.email,
        display_name: args.displayName ?? existing.display_name,
        locale: args.locale ?? existing.locale,
        timezone: args.timezone ?? existing.timezone,
        updatedAt: now
      });
    } else {
      await ctx.db.insert("users", {
        authSubject: args.userId,
        email: args.email ?? undefined,
        display_name: args.displayName ?? undefined,
        onboarding_completed: false,
        locale: args.locale ?? undefined,
        timezone: args.timezone ?? undefined,
        createdAt: now,
        updatedAt: now
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();
    if (!user) throw new Error("Failed to upsert user.");

    return toProfileRecord(args.userId, user);
  }
});

export const completeOnboarding = mutationGeneric({
  args: {
    userId: v.string(),
    email: v.optional(v.union(v.string(), v.null())),
    displayName: v.string(),
    goal: v.string(),
    marketingConsent: v.boolean(),
    timezone: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email ?? existing.email,
        display_name: args.displayName,
        onboarding_goal: args.goal,
        marketing_consent: args.marketingConsent,
        onboarding_completed: true,
        timezone: args.timezone ?? existing.timezone,
        updatedAt: now
      });
    } else {
      await ctx.db.insert("users", {
        authSubject: args.userId,
        email: args.email ?? undefined,
        display_name: args.displayName,
        onboarding_goal: args.goal,
        marketing_consent: args.marketingConsent,
        onboarding_completed: true,
        timezone: args.timezone ?? undefined,
        createdAt: now,
        updatedAt: now
      });
    }

    return { ok: true };
  }
});
