import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

export const upsertEntry = mutationGeneric({
  args: {
    email: v.string(),
    source: v.string(),
    utm_source: v.optional(v.union(v.string(), v.null())),
    utm_campaign: v.optional(v.union(v.string(), v.null())),
    utm_medium: v.optional(v.union(v.string(), v.null())),
    referrer: v.optional(v.union(v.string(), v.null())),
    createdAt: v.string()
  },
  handler: async (ctx, args) => {
    const emailLower = args.email.toLowerCase();
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email_lower", (q) => q.eq("email_lower", emailLower))
      .unique();

    if (existing) return { ok: true, duplicate: true };

    await ctx.db.insert("waitlist", {
      email: args.email,
      email_lower: emailLower,
      source: args.source,
      utm_source: args.utm_source ?? undefined,
      utm_campaign: args.utm_campaign ?? undefined,
      utm_medium: args.utm_medium ?? undefined,
      referrer: args.referrer ?? undefined,
      createdAt: Number.isNaN(Date.parse(args.createdAt)) ? Date.now() : Date.parse(args.createdAt)
    });

    return { ok: true, duplicate: false };
  }
});
