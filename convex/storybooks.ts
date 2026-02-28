import type { Id } from "./_generated/dataModel";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook, requireUser } from "./authz";
import { createDefaultGuidedChapter, instantiateGuidedChaptersFromTemplate } from "./storybookChapters";
import { loadTemplateV2ByIdFromDbOrSeed } from "./templates";

const bookModeValidator = v.union(v.literal("DIGITAL"), v.literal("PRINT"));
const bookStatusValidator = v.union(
  v.literal("DRAFT"),
  v.literal("ACTIVE"),
  v.literal("ARCHIVED"),
  v.literal("DELETED")
);

function toIso(value: number) {
  return new Date(value).toISOString();
}

function normalizeTitle(title?: string | null) {
  const trimmed = title?.trim();
  return trimmed && trimmed.length > 0 ? trimmed.slice(0, 200) : "Untitled Storybook";
}

function defaultExportSettings(pageSize: "A4" | "US_LETTER" | "BOOK_6X9" | "BOOK_8_5X11" = "BOOK_8_5X11") {
  return {
    exportTargets: {
      digitalPdf: true,
      hardcopyPdf: true
    },
    pageSize,
    margins: {
      top: 44,
      right: 44,
      bottom: 44,
      left: 44,
      unit: "px" as const
    },
    printPreset: {
      safeAreaPadding: 24,
      minImageWidthPx: 2000,
      imageQuality: "high" as const,
      disableLinksStyling: true
    },
    digitalPreset: {
      imageQuality: "medium" as const,
      enableLinksStyling: false,
      minImageWidthPx: 1200
    }
  };
}

function defaultNarrationSettings() {
  return {
    voice: "third_person" as const,
    tense: "past" as const,
    tone: "warm" as const,
    length: "medium" as const
  };
}

function toStorybookDto(doc: {
  _id: unknown;
  ownerId: string;
  title: string;
  subtitle?: string;
  bookMode: "DIGITAL" | "PRINT";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";
  coverAssetId?: unknown;
  settings?: unknown;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: String(doc._id),
    owner_id: doc.ownerId,
    title: doc.title,
    subtitle: doc.subtitle ?? null,
    book_mode: doc.bookMode,
    status: doc.status,
    cover_asset_id: doc.coverAssetId ? String(doc.coverAssetId) : null,
    settings:
      doc.settings && typeof doc.settings === "object" && !Array.isArray(doc.settings)
        ? (doc.settings as Record<string, unknown>)
        : {},
    created_at: toIso(doc.createdAt),
    updated_at: toIso(doc.updatedAt)
  };
}

export const create = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    title: v.optional(v.string()),
    bookMode: v.optional(bookModeValidator),
    templateId: v.optional(v.string()),
    templateVersion: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const now = Date.now();
    const id = await ctx.db.insert("storybooks", {
      ownerId: viewer.subject,
      title: normalizeTitle(args.title),
      templateId: args.templateId ?? null,
      bookMode: args.bookMode ?? "DIGITAL",
      status: "DRAFT",
      narration: defaultNarrationSettings(),
      settings:
        args.templateId || args.templateVersion
          ? {
            ...defaultExportSettings(),
            templateId: args.templateId ?? null,
            templateVersion: args.templateVersion ?? null
          }
          : defaultExportSettings(),
      createdAt: now,
      updatedAt: now
    });
    const created = await ctx.db.get(id);
    if (!created) throw new Error("Failed to create storybook");
    return toStorybookDto(created as never);
  }
});

export const createGuided = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    templateId: v.optional(v.union(v.string(), v.null())),
    optionalTitle: v.optional(v.union(v.string(), v.null())),
    clientRequestId: v.string()
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);

    const existing = await ctx.db
      .query("storybooks")
      .withIndex("by_ownerId_guidedClientRequestId", (q: any) =>
        q.eq("ownerId", viewer.subject).eq("guidedClientRequestId", args.clientRequestId)
      )
      .unique();

    if (existing) {
      const chapters = await ctx.db
        .query("storybookChapters")
        .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", existing._id as Id<"storybooks">))
        .collect();
      return {
        storybookId: String(existing._id),
        templateId: existing.templateId ?? null,
        chapters: chapters
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((chapter) => ({
            id: String(chapter._id),
            chapterKey: chapter.chapterKey,
            title: chapter.title,
            orderIndex: chapter.orderIndex,
            status: chapter.status
          }))
      };
    }

    let resolvedTemplate = null;
    if (args.templateId) {
      resolvedTemplate = await loadTemplateV2ByIdFromDbOrSeed(ctx, args.templateId);
      if (!resolvedTemplate) throw new Error("Template not found");
    }

    const now = Date.now();
    const providedTitle = args.optionalTitle?.trim();
    const title = providedTitle
      ? normalizeTitle(providedTitle)
      : normalizeTitle(resolvedTemplate?.title ?? (args.templateId ? "New Storybook" : "My Storybook"));

    const storybookId = await ctx.db.insert("storybooks", {
      ownerId: viewer.subject,
      title,
      templateId: args.templateId ?? null,
      bookMode: "DIGITAL",
      status: "DRAFT",
      narration: defaultNarrationSettings(),
      guidedClientRequestId: args.clientRequestId,
      settings: {
        ...defaultExportSettings(),
        guidedFlow: {
          path: args.templateId ? "template" : "freeform",
          templateId: args.templateId ?? null,
          templateVersion: resolvedTemplate?.version ?? null
        }
      },
      createdAt: now,
      updatedAt: now
    });

    const chapters = resolvedTemplate
      ? await instantiateGuidedChaptersFromTemplate(ctx, {
        storybookId,
        template: resolvedTemplate
      })
      : [await createDefaultGuidedChapter(ctx, storybookId)];

    return {
      storybookId: String(storybookId),
      templateId: args.templateId ?? null,
      chapters
    };
  }
});

export const listMine = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const rows = await ctx.db
      .query("storybooks")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", viewer.subject))
      .collect();

    return rows
      .filter((row) => row.status !== "DELETED")
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((row) => toStorybookDto(row as never));
  }
});

export const get = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "VIEWER", args.viewerSubject);
    return toStorybookDto(access.storybook as never);
  }
});

export const getGuidedById = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "VIEWER", args.viewerSubject);
    let templateTitle: string | null = null;
    let templateSubtitle: string | null = null;

    if (access.storybook.templateId) {
      const template = await loadTemplateV2ByIdFromDbOrSeed(ctx, access.storybook.templateId);
      templateTitle = template?.title ?? null;
      templateSubtitle = template?.subtitle ?? null;
    }

    return {
      id: String(access.storybook._id),
      title: access.storybook.title,
      status: access.storybook.status,
      templateId: access.storybook.templateId ?? null,
      templateTitle,
      templateSubtitle,
      narration:
        access.storybook.narration && typeof access.storybook.narration === "object"
          ? access.storybook.narration
          : defaultNarrationSettings(),
      flowStatus: access.storybook.flowStatus ?? null,
      photoStatus: access.storybook.photoStatus ?? null,
      extraAnswer: access.storybook.extraAnswer ?? null,
      createdAt: access.storybook.createdAt,
      updatedAt: access.storybook.updatedAt
    };
  }
});

export const update = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    patch: v.object({
      title: v.optional(v.string()),
      subtitle: v.optional(v.union(v.string(), v.null())),
      book_mode: v.optional(bookModeValidator),
      status: v.optional(bookStatusValidator),
      settings: v.optional(v.any()),
      cover_asset_id: v.optional(v.union(v.id("assets"), v.string(), v.null()))
    })
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    const patch: Record<string, unknown> = {
      updatedAt: now
    };

    if (typeof args.patch.title === "string") patch.title = normalizeTitle(args.patch.title);
    if ("subtitle" in args.patch) patch.subtitle = args.patch.subtitle ?? undefined;
    if (args.patch.book_mode) patch.bookMode = args.patch.book_mode;
    if (args.patch.status) patch.status = args.patch.status;
    if ("settings" in args.patch) patch.settings = args.patch.settings ?? {};
    if ("cover_asset_id" in args.patch) {
      const value = args.patch.cover_asset_id;
      patch.coverAssetId = typeof value === "string" && !value ? undefined : (value as unknown);
    }

    await ctx.db.patch(access.storybook._id as never, patch as never);
    const updated = await ctx.db.get(access.storybook._id as never);
    if (!updated) throw new Error("Not found");
    return toStorybookDto(updated as never);
  }
});

export const updateSettings = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    settingsPatch: v.object({
      pageSize: v.optional(v.union(v.literal("A4"), v.literal("US_LETTER"), v.literal("BOOK_6X9"), v.literal("BOOK_8_5X11"))),
      margins: v.optional(v.any()),
      grid: v.optional(v.any()),
      exportTargets: v.optional(
        v.object({
          digitalPdf: v.boolean(),
          hardcopyPdf: v.optional(v.boolean()),
          printPdf: v.optional(v.boolean())
        })
      ),
      printPreset: v.optional(v.any()),
      digitalPreset: v.optional(v.any())
    })
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const currentSettings =
      access.storybook.settings && typeof access.storybook.settings === "object" && !Array.isArray(access.storybook.settings)
        ? (access.storybook.settings as Record<string, unknown>)
        : {};
    const nextSettings: Record<string, unknown> = { ...currentSettings };
    if ("pageSize" in args.settingsPatch && args.settingsPatch.pageSize) {
      nextSettings.pageSize = args.settingsPatch.pageSize;
    }
    if ("margins" in args.settingsPatch && args.settingsPatch.margins) {
      nextSettings.margins = args.settingsPatch.margins;
    }
    if ("grid" in args.settingsPatch && args.settingsPatch.grid) {
      nextSettings.grid = args.settingsPatch.grid;
    }
    if ("exportTargets" in args.settingsPatch && args.settingsPatch.exportTargets) {
      nextSettings.exportTargets = {
        ...(typeof currentSettings.exportTargets === "object" && currentSettings.exportTargets
          ? (currentSettings.exportTargets as Record<string, unknown>)
          : {}),
        digitalPdf: args.settingsPatch.exportTargets.digitalPdf,
        hardcopyPdf:
          typeof args.settingsPatch.exportTargets.hardcopyPdf === "boolean"
            ? args.settingsPatch.exportTargets.hardcopyPdf
            : Boolean(args.settingsPatch.exportTargets.printPdf)
      };
    }
    if ("printPreset" in args.settingsPatch && args.settingsPatch.printPreset) {
      nextSettings.printPreset = args.settingsPatch.printPreset;
    }
    if ("digitalPreset" in args.settingsPatch && args.settingsPatch.digitalPreset) {
      nextSettings.digitalPreset = args.settingsPatch.digitalPreset;
    }
    if (!("exportTargets" in nextSettings) || !nextSettings.exportTargets) {
      nextSettings.exportTargets = defaultExportSettings().exportTargets;
    }
    if (!("printPreset" in nextSettings) || !nextSettings.printPreset) {
      nextSettings.printPreset = defaultExportSettings().printPreset;
    }
    if (!("digitalPreset" in nextSettings) || !nextSettings.digitalPreset) {
      nextSettings.digitalPreset = defaultExportSettings().digitalPreset;
    }
    await ctx.db.patch(access.storybook._id as never, {
      settings: nextSettings,
      updatedAt: Date.now()
    });
    const updated = await ctx.db.get(access.storybook._id as never);
    if (!updated) throw new Error("Not found");
    return toStorybookDto(updated as never);
  }
});

export const updateNarration = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    narration: v.object({
      voice: v.union(v.literal("first_person"), v.literal("third_person")),
      tense: v.union(v.literal("past"), v.literal("present")),
      tone: v.union(v.literal("warm"), v.literal("formal"), v.literal("playful"), v.literal("poetic")),
      length: v.union(v.literal("short"), v.literal("medium"), v.literal("long"))
    })
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    await ctx.db.patch(access.storybook._id as never, {
      narration: args.narration,
      updatedAt: Date.now()
    });
    const updated = await ctx.db.get(access.storybook._id as never);
    if (!updated) throw new Error("Not found");
    return {
      ok: true,
      storybookId: String(updated._id),
      narration: updated.narration ?? defaultNarrationSettings()
    };
  }
});

export const archive = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    await ctx.db.patch(access.storybook._id as never, {
      status: "ARCHIVED",
      updatedAt: Date.now()
    });
    return { ok: true };
  }
});

export const remove = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);

    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    const blocks = await ctx.db
      .query("chapterBlocks")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    const collaborators = await ctx.db
      .query("collaborators")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();

    for (const row of blocks) {
      await ctx.db.delete(row._id);
    }
    for (const row of chapters) {
      await ctx.db.delete(row._id);
    }
    for (const row of collaborators) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.delete(access.storybook._id as never);

    return { ok: true };
  }
});

// Sprint 28: Guided flow state mutations

export const setLastPointer = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    questionId: v.string()
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const storybook = await ctx.db.get(args.storybookId);
    if (!storybook || storybook.ownerId !== viewer.subject) throw new Error("Forbidden");
    await ctx.db.patch(args.storybookId, {
      lastPointer: {
        chapterInstanceId: args.chapterInstanceId,
        questionId: args.questionId,
        updatedAt: Date.now()
      },
      updatedAt: Date.now()
    });
    return { ok: true };
  }
});

export const setExtraAnswer = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    text: v.optional(v.union(v.string(), v.null())),
    skipped: v.boolean()
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const storybook = await ctx.db.get(args.storybookId);
    if (!storybook || storybook.ownerId !== viewer.subject) throw new Error("Forbidden");
    await ctx.db.patch(args.storybookId, {
      extraAnswer: {
        text: args.text ?? null,
        skipped: args.skipped,
        updatedAt: Date.now()
      },
      updatedAt: Date.now()
    });
    return { ok: true };
  }
});

export const setPhotoStatus = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    photoStatus: v.union(v.literal("not_started"), v.literal("done"), v.literal("skipped"))
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const storybook = await ctx.db.get(args.storybookId);
    if (!storybook || storybook.ownerId !== viewer.subject) throw new Error("Forbidden");
    await ctx.db.patch(args.storybookId, { photoStatus: args.photoStatus, updatedAt: Date.now() });
    return { ok: true };
  }
});

export const setFlowStatus = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    flowStatus: v.union(
      v.literal("needs_questions"),
      v.literal("needs_extra_question"),
      v.literal("needs_upload_photos"),
      v.literal("populating"),
      v.literal("ready_in_studio"),
      v.literal("error")
    )
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const storybook = await ctx.db.get(args.storybookId);
    if (!storybook || storybook.ownerId !== viewer.subject) throw new Error("Forbidden");
    await ctx.db.patch(args.storybookId, { flowStatus: args.flowStatus, updatedAt: Date.now() });
    return { ok: true };
  }
});

export const getFlowState = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const storybook = await ctx.db.get(args.storybookId);
    if (!storybook || storybook.ownerId !== viewer.subject) throw new Error("Forbidden");
    return {
      flowStatus: storybook.flowStatus ?? null,
      photoStatus: storybook.photoStatus ?? null,
      extraAnswer: storybook.extraAnswer ?? null,
      lastPointer: storybook.lastPointer ?? null
    };
  }
});

// Backward-compatible aliases used by existing wrappers/tests during the migration.
export const createStorybook = create;
export const listStorybooks = listMine;
export const getStorybook = get;
export const updateStorybook = update;
export const updateStorybookSettings = updateSettings;
