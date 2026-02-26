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
  r2UsageMonthly: defineTable({
    monthKey: v.string(),
    reservedStorageBytes: v.number(),
    classAOps: v.number(),
    classBOps: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_monthKey", ["monthKey"]),
  templates: defineTable({
    templateId: v.string(),
    title: v.string(),
    subtitle: v.string(),
    templateJson: v.any(),
    isActive: v.boolean(),
    createdAt: v.number()
  })
    .index("by_templateId", ["templateId"])
    .index("by_isActive", ["isActive"]),
  storybooks: defineTable({
    ownerId: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    templateId: v.optional(v.union(v.string(), v.null())),
    bookMode: v.union(v.literal("DIGITAL"), v.literal("PRINT")),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("ACTIVE"),
      v.literal("ARCHIVED"),
      v.literal("DELETED")
    ),
    coverAssetId: v.optional(v.id("assets")),
    narration: v.optional(v.any()),
    guidedClientRequestId: v.optional(v.string()),
    settings: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_ownerId_updatedAt", ["ownerId", "updatedAt"])
    .index("by_templateId", ["templateId"])
    .index("by_ownerId_guidedClientRequestId", ["ownerId", "guidedClientRequestId"]),
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
  storybookChapters: defineTable({
    storybookId: v.id("storybooks"),
    chapterKey: v.string(),
    title: v.string(),
    orderIndex: v.number(),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    completedAt: v.optional(v.union(v.number(), v.null())),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_storybookId", ["storybookId"])
    .index("by_storybookId_orderIndex", ["storybookId", "orderIndex"])
    .index("by_storybookId_status", ["storybookId", "status"]),
  chapterAnswers: defineTable({
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    questionId: v.string(),
    answerText: v.optional(v.union(v.string(), v.null())),
    answerJson: v.optional(v.union(v.any(), v.null())),
    skipped: v.boolean(),
    source: v.union(v.literal("text"), v.literal("voice")),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_chapterInstanceId_questionId", ["chapterInstanceId", "questionId"])
    .index("by_storybookId", ["storybookId"])
    .index("by_chapterInstanceId", ["chapterInstanceId"]),
  pages: defineTable({
    storybookId: v.id("storybooks"),
    ownerId: v.string(),
    orderIndex: v.number(),
    sizePreset: v.union(
      v.literal("A4"),
      v.literal("US_LETTER"),
      v.literal("BOOK_6X9"),
      v.literal("BOOK_8_5X11")
    ),
    widthPx: v.number(),
    heightPx: v.number(),
    margins: v.object({
      top: v.number(),
      right: v.number(),
      bottom: v.number(),
      left: v.number(),
      unit: v.literal("px")
    }),
    grid: v.object({
      enabled: v.boolean(),
      columns: v.number(),
      gutter: v.number(),
      rowHeight: v.number(),
      showGuides: v.boolean()
    }),
    background: v.object({
      fill: v.string()
    }),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_storybookId_orderIndex", ["storybookId", "orderIndex"])
    .index("by_ownerId", ["ownerId"]),
  frames: defineTable({
    storybookId: v.id("storybooks"),
    pageId: v.id("pages"),
    ownerId: v.string(),
    type: v.union(
      v.literal("TEXT"),
      v.literal("IMAGE"),
      v.literal("SHAPE"),
      v.literal("LINE"),
      v.literal("FRAME"),
      v.literal("GROUP")
    ),
    x: v.number(),
    y: v.number(),
    w: v.number(),
    h: v.number(),
    zIndex: v.number(),
    locked: v.boolean(),
    style: v.optional(v.any()),
    content: v.optional(v.any()),
    crop: v.optional(v.any()),
    version: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_pageId_zIndex", ["pageId", "zIndex"])
    .index("by_storybookId", ["storybookId"])
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
  exports: defineTable({
    storybookId: v.id("storybooks"),
    ownerId: v.string(),
    exportTarget: v.union(v.literal("DIGITAL_PDF"), v.literal("HARDCOPY_PRINT_PDF")),
    exportHash: v.string(),
    status: v.union(v.literal("SUCCESS"), v.literal("FAILED")),
    pageCount: v.number(),
    warningsCount: v.number(),
    runtimeMs: v.optional(v.number()),
    fileKey: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    errorSummary: v.optional(v.string()),
    createdAt: v.number()
  })
    .index("by_storybookId_createdAt", ["storybookId", "createdAt"])
    .index("by_ownerId_createdAt", ["ownerId", "createdAt"])
    .index("by_storybookId_exportHash", ["storybookId", "exportHash"]),
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
