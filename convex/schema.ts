import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authSubject: v.string(),
    email: v.optional(v.string()),
    display_name: v.optional(v.string()),
    onboarding_completed: v.boolean(),
    onboarding_goal: v.optional(v.string()),
    marketing_consent: v.optional(v.boolean()),
    locale: v.optional(v.string()),
    timezone: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_auth_subject", ["authSubject"])
    .index("by_email", ["email"]),
  waitlist: defineTable({
    email: v.string(),
    email_lower: v.string(),
    source: v.string(),
    utm_source: v.optional(v.string()),
    utm_campaign: v.optional(v.string()),
    utm_medium: v.optional(v.string()),
    referrer: v.optional(v.string()),
    createdAt: v.number()
  })
    .index("by_email_lower", ["email_lower"])
    .index("by_createdAt", ["createdAt"])
});
