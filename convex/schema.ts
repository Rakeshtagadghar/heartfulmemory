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
  billingCustomers: defineTable({
    userId: v.string(),
    email: v.optional(v.union(v.string(), v.null())),
    stripeCustomerId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_userId", ["userId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),
  billingSubscriptions: defineTable({
    userId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    planId: v.string(),
    status: v.union(
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid"),
      v.literal("incomplete")
    ),
    currentPeriodStart: v.optional(v.union(v.number(), v.null())),
    currentPeriodEnd: v.optional(v.union(v.number(), v.null())),
    cancelAtPeriodEnd: v.boolean(),
    cancelAt: v.optional(v.union(v.number(), v.null())),
    canceledAt: v.optional(v.union(v.number(), v.null())),
    latestInvoiceId: v.optional(v.union(v.string(), v.null())),
    updatedAt: v.number()
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),
  billingWebhookEvents: defineTable({
    stripeEventId: v.string(),
    eventType: v.string(),
    processedAt: v.number(),
    subscriptionId: v.optional(v.union(v.string(), v.null()))
  }).index("by_stripeEventId", ["stripeEventId"]),
  exportUsage: defineTable({
    userId: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    countPdfExports: v.number(),
    updatedAt: v.number()
  }).index("by_userId_periodStart", ["userId", "periodStart"]),
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
    // Sprint 28: guided flow state
    flowStatus: v.optional(
      v.union(
        v.literal("needs_questions"),
        v.literal("needs_extra_question"),
        v.literal("needs_upload_photos"),
        v.literal("populating"),
        v.literal("ready_in_studio"),
        v.literal("error")
      )
    ),
    photoStatus: v.optional(
      v.union(v.literal("not_started"), v.literal("done"), v.literal("skipped"))
    ),
    lastPointer: v.optional(
      v.object({
        chapterInstanceId: v.id("storybookChapters"),
        questionId: v.string(),
        updatedAt: v.number()
      })
    ),
    extraAnswer: v.optional(
      v.object({
        text: v.optional(v.union(v.string(), v.null())),
        skipped: v.boolean(),
        updatedAt: v.number()
      })
    ),
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
    sttMeta: v.optional(
      v.union(
        v.object({
          provider: v.union(v.literal("groq"), v.literal("elevenlabs")),
          confidence: v.optional(v.union(v.number(), v.null())),
          durationMs: v.optional(v.union(v.number(), v.null())),
          providerRequestId: v.optional(v.union(v.string(), v.null())),
          mimeType: v.optional(v.union(v.string(), v.null())),
          bytes: v.optional(v.union(v.number(), v.null()))
        }),
        v.null()
      )
    ),
    audioRef: v.optional(v.union(v.string(), v.null())),
    skipped: v.boolean(),
    source: v.union(v.literal("text"), v.literal("voice"), v.literal("ai_narrated")),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_chapterInstanceId_questionId", ["chapterInstanceId", "questionId"])
    .index("by_storybookId", ["storybookId"])
    .index("by_chapterInstanceId", ["chapterInstanceId"]),
  chapterDrafts: defineTable({
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    chapterKey: v.string(),
    version: v.number(),
    status: v.union(v.literal("generating"), v.literal("ready"), v.literal("error")),
    narration: v.object({
      voice: v.union(v.literal("first_person"), v.literal("third_person")),
      tense: v.union(v.literal("past"), v.literal("present")),
      tone: v.union(v.literal("warm"), v.literal("formal"), v.literal("playful"), v.literal("poetic")),
      length: v.union(v.literal("short"), v.literal("medium"), v.literal("long"))
    }),
    sections: v.array(
      v.object({
        sectionId: v.string(),
        title: v.string(),
        guidance: v.optional(v.string()),
        text: v.string(),
        wordCount: v.number(),
        citations: v.array(v.string()),
        uncertain: v.optional(v.boolean())
      })
    ),
    summary: v.string(),
    keyFacts: v.array(
      v.object({
        text: v.string(),
        citations: v.array(v.string()),
        uncertain: v.optional(v.boolean())
      })
    ),
    quotes: v.array(
      v.object({
        text: v.string(),
        speaker: v.optional(v.string()),
        citations: v.array(v.string()),
        uncertain: v.optional(v.boolean())
      })
    ),
    entities: v.object({
      people: v.array(v.string()),
      places: v.array(v.string()),
      dates: v.array(v.string())
    }),
    entitiesV2: v.optional(
      v.object({
        people: v.array(
          v.object({
            value: v.string(),
            kind: v.union(v.literal("person"), v.literal("role")),
            confidence: v.number(),
            citations: v.array(v.string()),
            source: v.union(v.literal("llm"), v.literal("override"))
          })
        ),
        places: v.array(
          v.object({
            value: v.string(),
            confidence: v.number(),
            citations: v.array(v.string()),
            source: v.union(v.literal("llm"), v.literal("override"))
          })
        ),
        dates: v.array(
          v.object({
            value: v.string(),
            normalized: v.string(),
            confidence: v.number(),
            citations: v.array(v.string()),
            source: v.union(v.literal("llm"), v.literal("override"))
          })
        ),
        meta: v.object({
          version: v.literal(2),
          generatedAt: v.number(),
          generator: v.literal("llm_extractor_v2")
        })
      })
    ),
    imageIdeas: v.array(
      v.object({
        query: v.string(),
        reason: v.string(),
        slotHint: v.optional(v.string())
      })
    ),
    answersHash: v.optional(v.string()),
    sourceAnswerIds: v.array(v.string()),
    warnings: v.optional(
      v.array(
        v.object({
          code: v.string(),
          message: v.string(),
          severity: v.union(v.literal("info"), v.literal("warning"), v.literal("error")),
          sectionId: v.optional(v.string())
        })
      )
    ),
    generationScope: v.optional(
      v.union(
        v.object({
          kind: v.literal("full")
        }),
        v.object({
          kind: v.literal("section"),
          targetSectionId: v.string()
        })
      )
    ),
    errorCode: v.optional(v.union(v.string(), v.null())),
    errorMessage: v.optional(v.union(v.string(), v.null())),
    approvedAt: v.optional(v.union(v.number(), v.null())),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_storybookId", ["storybookId"])
    .index("by_chapterInstanceId", ["chapterInstanceId"])
    .index("by_storybookId_chapterKey", ["storybookId", "chapterKey"])
    .index("by_chapterInstanceId_version", ["chapterInstanceId", "version"]),
  chapterEntityOverrides: defineTable({
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    adds: v.object({
      people: v.array(
        v.object({
          value: v.string(),
          kind: v.union(v.literal("person"), v.literal("role")),
          confidence: v.number(),
          citations: v.array(v.string()),
          source: v.union(v.literal("llm"), v.literal("override"))
        })
      ),
      places: v.array(
        v.object({
          value: v.string(),
          confidence: v.number(),
          citations: v.array(v.string()),
          source: v.union(v.literal("llm"), v.literal("override"))
        })
      ),
      dates: v.array(
        v.object({
          value: v.string(),
          normalized: v.string(),
          confidence: v.number(),
          citations: v.array(v.string()),
          source: v.union(v.literal("llm"), v.literal("override"))
        })
      )
    }),
    removes: v.array(
      v.object({
        kind: v.union(v.literal("people"), v.literal("places"), v.literal("dates")),
        value: v.string()
      })
    ),
    updatedAt: v.number(),
    createdAt: v.number()
  })
    .index("by_chapterInstanceId", ["chapterInstanceId"])
    .index("by_storybookId", ["storybookId"]),
  mediaAssets: defineTable({
    ownerUserId: v.optional(v.union(v.string(), v.null())),
    type: v.literal("image"),
    source: v.union(v.literal("upload"), v.literal("unsplash"), v.literal("pexels"), v.literal("system")),
    sourceId: v.optional(v.union(v.string(), v.null())),
    cachedUrl: v.string(),
    thumbUrl: v.optional(v.union(v.string(), v.null())),
    width: v.number(),
    height: v.number(),
    mime: v.optional(v.union(v.string(), v.null())),
    attribution: v.object({
      authorName: v.string(),
      authorUrl: v.optional(v.union(v.string(), v.null())),
      assetUrl: v.optional(v.union(v.string(), v.null())),
      licenseUrl: v.optional(v.union(v.string(), v.null())),
      provider: v.union(v.literal("upload"), v.literal("unsplash"), v.literal("pexels"), v.literal("system")),
      attributionText: v.string()
    }),
    createdAt: v.number()
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_source_sourceId", ["source", "sourceId"]),
  chapterIllustrations: defineTable({
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    chapterKey: v.string(),
    version: v.number(),
    status: v.union(v.literal("selecting"), v.literal("ready"), v.literal("error")),
    theme: v.object({
      queries: v.array(v.string()),
      keywords: v.array(v.string()),
      negativeKeywords: v.array(v.string())
    }),
    slotTargets: v.array(
      v.object({
        slotId: v.string(),
        aspectTarget: v.number(),
        orientation: v.union(v.literal("landscape"), v.literal("portrait"), v.literal("square")),
        minShortSidePx: v.number()
      })
    ),
    slotAssignments: v.array(
      v.object({
        slotId: v.string(),
        mediaAssetId: v.id("mediaAssets"),
        providerMetaSnapshot: v.any()
      })
    ),
    lockedSlotIds: v.array(v.string()),
    errorCode: v.optional(v.union(v.string(), v.null())),
    errorMessage: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_chapterInstanceId", ["chapterInstanceId"])
    .index("by_storybookId", ["storybookId"])
    .index("by_chapterInstanceId_version", ["chapterInstanceId", "version"]),
  chapterStudioState: defineTable({
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    chapterKey: v.string(),
    status: v.union(
      v.literal("not_started"),
      v.literal("populated"),
      v.literal("edited"),
      v.literal("finalized")
    ),
    lastAppliedDraftVersion: v.optional(v.union(v.number(), v.null())),
    lastAppliedIllustrationVersion: v.optional(v.union(v.number(), v.null())),
    pageIds: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_storybookId", ["storybookId"])
    .index("by_chapterInstanceId", ["chapterInstanceId"]),
  pages: defineTable({
    storybookId: v.id("storybooks"),
    ownerId: v.string(),
    orderIndex: v.number(),
    title: v.optional(v.string()),
    isHidden: v.optional(v.boolean()),
    isLocked: v.optional(v.boolean()),
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
    .index("by_invitedEmail", ["invitedEmail"]),
  storybookPhotos: defineTable({
    storybookId: v.id("storybooks"),
    ownerUserId: v.string(),
    assetId: v.id("assets"),
    orderIndex: v.number(),
    createdAt: v.number()
  })
    .index("by_storybookId", ["storybookId"])
    .index("by_storybookId_orderIndex", ["storybookId", "orderIndex"]),
  chapterNarratives: defineTable({
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    chapterKey: v.string(),
    version: v.number(),
    status: v.union(v.literal("generating"), v.literal("ready"), v.literal("error")),
    approved: v.boolean(),
    approvedAt: v.optional(v.union(v.number(), v.null())),
    narration: v.object({
      voice: v.union(v.literal("first_person"), v.literal("third_person")),
      tense: v.union(v.literal("past"), v.literal("present")),
      tone: v.union(v.literal("warm"), v.literal("formal"), v.literal("playful"), v.literal("poetic")),
      length: v.union(v.literal("short"), v.literal("medium"), v.literal("long"))
    }),
    paragraphs: v.object({
      opening: v.string(),
      story: v.string(),
      closing: v.string()
    }),
    citations: v.object({
      opening: v.array(v.string()),
      story: v.array(v.string()),
      closing: v.array(v.string())
    }),
    answersHash: v.string(),
    warnings: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_chapterInstanceId", ["chapterInstanceId"])
    .index("by_storybookId", ["storybookId"])
});
