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
    .index("by_createdAt", ["createdAt"]),
  storybooks: defineTable({
    ownerId: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    bookMode: v.union(v.literal("DIGITAL"), v.literal("PRINT")),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("ACTIVE"),
      v.literal("ARCHIVED"),
      v.literal("DELETED")
    ),
    coverAssetId: v.optional(v.id("assets")),
    settings: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_ownerId_updatedAt", ["ownerId", "updatedAt"]),
  chapters: defineTable({
    storybookId: v.id("storybooks"),
    ownerId: v.string(),
    title: v.string(),
    status: v.union(v.literal("DRAFT"), v.literal("FINAL")),
    orderIndex: v.number(),
    summary: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_storybookId_orderIndex", ["storybookId", "orderIndex"])
    .index("by_ownerId", ["ownerId"]),
  chapterBlocks: defineTable({
    storybookId: v.id("storybooks"),
    chapterId: v.id("chapters"),
    ownerId: v.string(),
    type: v.union(
      v.literal("TEXT"),
      v.literal("IMAGE"),
      v.literal("VIDEO"),
      v.literal("GIF"),
      v.literal("EMBED")
    ),
    orderIndex: v.number(),
    content: v.optional(v.any()),
    version: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_chapterId_orderIndex", ["chapterId", "orderIndex"])
    .index("by_storybookId", ["storybookId"])
    .index("by_ownerId", ["ownerId"]),
  assets: defineTable({
    ownerId: v.string(),
    source: v.union(
      v.literal("UPLOAD"),
      v.literal("UNSPLASH"),
      v.literal("PEXELS"),
      v.literal("PIXABAY"),
      v.literal("OPENVERSE"),
      v.literal("RAWPIXEL_PD"),
      v.literal("VECTEEZY")
    ),
    sourceAssetId: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    storageProvider: v.optional(v.string()),
    storageBucket: v.optional(v.string()),
    storageKey: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    sizeBytes: v.optional(v.number()),
    checksum: v.optional(v.string()),
    license: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_storageKey", ["storageKey"]),
  collaborators: defineTable({
    storybookId: v.id("storybooks"),
    invitedEmail: v.optional(v.string()),
    userId: v.optional(v.string()),
    role: v.union(v.literal("OWNER"), v.literal("EDITOR"), v.literal("VIEWER")),
    status: v.union(v.literal("PENDING"), v.literal("ACCEPTED"), v.literal("REVOKED")),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_storybookId", ["storybookId"])
    .index("by_userId", ["userId"])
    .index("by_invitedEmail", ["invitedEmail"])
});
