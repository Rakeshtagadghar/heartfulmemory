import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";
import type {
  ChapterDraftEntities,
  ChapterDraftGenerationScope,
  ChapterDraftImageIdea,
  ChapterDraftKeyFact,
  ChapterDraftQuote,
  ChapterDraftSection,
  DraftNarrationSettings
} from "../packages/shared/drafts/draftTypes";

type ConvexCtx = MutationCtx | QueryCtx;
type ChapterDraftDoc = Doc<"chapterDrafts">;

const narrationValidator = v.object({
  voice: v.union(v.literal("first_person"), v.literal("third_person")),
  tense: v.union(v.literal("past"), v.literal("present")),
  tone: v.union(v.literal("warm"), v.literal("formal"), v.literal("playful"), v.literal("poetic")),
  length: v.union(v.literal("short"), v.literal("medium"), v.literal("long"))
});

const sectionValidator = v.object({
  sectionId: v.string(),
  title: v.string(),
  text: v.string(),
  wordCount: v.number(),
  citations: v.array(v.string()),
  uncertain: v.optional(v.boolean())
});

const keyFactValidator = v.object({
  text: v.string(),
  citations: v.array(v.string()),
  uncertain: v.optional(v.boolean())
});

const quoteValidator = v.object({
  text: v.string(),
  speaker: v.optional(v.string()),
  citations: v.array(v.string()),
  uncertain: v.optional(v.boolean())
});

const entitiesValidator = v.object({
  people: v.array(v.string()),
  places: v.array(v.string()),
  dates: v.array(v.string())
});

const imageIdeaValidator = v.object({
  query: v.string(),
  reason: v.string(),
  slotHint: v.optional(v.string())
});

const warningValidator = v.object({
  code: v.string(),
  message: v.string(),
  severity: v.union(v.literal("info"), v.literal("warning"), v.literal("error")),
  sectionId: v.optional(v.string())
});

const generationScopeValidator = v.union(
  v.object({
    kind: v.literal("full")
  }),
  v.object({
    kind: v.literal("section"),
    targetSectionId: v.string()
  })
);

function normalizeNarration(value: unknown): DraftNarrationSettings {
  const fallback: DraftNarrationSettings = {
    voice: "third_person",
    tense: "past",
    tone: "warm",
    length: "medium"
  };
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const input = value as Record<string, unknown>;
  return {
    voice: input.voice === "first_person" ? "first_person" : "third_person",
    tense: input.tense === "present" ? "present" : "past",
    tone:
      input.tone === "formal" || input.tone === "playful" || input.tone === "poetic" || input.tone === "warm"
        ? input.tone
        : "warm",
    length: input.length === "short" || input.length === "long" || input.length === "medium" ? input.length : "medium"
  };
}

function normalizeGenerationScope(value: unknown): ChapterDraftGenerationScope | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (input.kind === "full") return { kind: "full" };
  if (input.kind === "section" && typeof input.targetSectionId === "string") {
    return { kind: "section", targetSectionId: input.targetSectionId };
  }
  return null;
}

function toDraftDto(doc: ChapterDraftDoc) {
  return {
    id: String(doc._id),
    storybookId: String(doc.storybookId),
    chapterInstanceId: String(doc.chapterInstanceId),
    chapterKey: doc.chapterKey,
    version: doc.version,
    status: doc.status,
    narration: normalizeNarration(doc.narration),
    sections: doc.sections,
    summary: doc.summary,
    keyFacts: doc.keyFacts,
    quotes: doc.quotes,
    entities: doc.entities,
    imageIdeas: doc.imageIdeas,
    sourceAnswerIds: doc.sourceAnswerIds,
    warnings: doc.warnings ?? [],
    generationScope: normalizeGenerationScope(doc.generationScope),
    errorCode: doc.errorCode ?? null,
    errorMessage: doc.errorMessage ?? null,
    approvedAt: doc.approvedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

async function getDraftOrThrow(ctx: ConvexCtx, draftId: Id<"chapterDrafts">) {
  const row = await ctx.db.get(draftId);
  if (!row) throw new Error("Draft not found");
  return row;
}

async function getChapterOrThrow(ctx: ConvexCtx, chapterInstanceId: Id<"storybookChapters">) {
  const row = await ctx.db.get(chapterInstanceId);
  if (!row) throw new Error("Chapter instance not found");
  return row;
}

async function assertChapterBelongsToStorybook(
  ctx: ConvexCtx,
  storybookId: Id<"storybooks">,
  chapterInstanceId: Id<"storybookChapters">
) {
  const chapter = await getChapterOrThrow(ctx, chapterInstanceId);
  if (String(chapter.storybookId) !== String(storybookId)) {
    throw new Error("Chapter does not belong to storybook");
  }
  return chapter;
}

function emptyEntities(): ChapterDraftEntities {
  return {
    people: [],
    places: [],
    dates: []
  };
}

function normalizeWordCount(text: string, wordCount?: number) {
  if (typeof wordCount === "number" && Number.isFinite(wordCount) && wordCount >= 0) {
    return Math.floor(wordCount);
  }
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.length;
}

function normalizeSections(sections: ChapterDraftSection[]): ChapterDraftSection[] {
  return sections.map((section) => ({
    ...section,
    text: section.text ?? "",
    wordCount: normalizeWordCount(section.text ?? "", section.wordCount),
    citations: Array.isArray(section.citations) ? [...section.citations] : []
  }));
}

function cloneDraftContent(doc: ChapterDraftDoc) {
  return {
    sections: doc.sections.map((section) => ({ ...section, citations: [...section.citations] })),
    summary: doc.summary,
    keyFacts: doc.keyFacts.map((fact) => ({ ...fact, citations: [...fact.citations] })),
    quotes: doc.quotes.map((quote) => ({ ...quote, citations: [...quote.citations] })),
    entities: {
      people: [...doc.entities.people],
      places: [...doc.entities.places],
      dates: [...doc.entities.dates]
    },
    imageIdeas: doc.imageIdeas.map((idea) => ({ ...idea })),
    warnings: doc.warnings?.map((warning) => ({ ...warning })) ?? [],
    sourceAnswerIds: [...doc.sourceAnswerIds]
  };
}

async function nextVersionForChapter(ctx: MutationCtx, chapterInstanceId: Id<"storybookChapters">) {
  const rows = await ctx.db
    .query("chapterDrafts")
    .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", chapterInstanceId))
    .collect();
  return rows.reduce((max, row) => Math.max(max, row.version), 0) + 1;
}

async function touchStorybook(ctx: MutationCtx, storybookId: Id<"storybooks">, at = Date.now()) {
  await ctx.db.patch(storybookId, { updatedAt: at });
}

export const listByStorybook = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapterDrafts")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    return rows
      .sort((a, b) => (a.chapterKey === b.chapterKey ? b.version - a.version : a.chapterKey.localeCompare(b.chapterKey)))
      .map(toDraftDto);
  }
});

export const listByChapter = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapterDrafts")
      .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", args.chapterInstanceId))
      .collect();
    return rows.sort((a, b) => b.version - a.version).map(toDraftDto);
  }
});

export const getLatestByChapter = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapterDrafts")
      .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", args.chapterInstanceId))
      .collect();
    const latest = rows.sort((a, b) => b.version - a.version)[0] ?? null;
    return latest ? toDraftDto(latest) : null;
  }
});

export const getById = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    draftId: v.id("chapterDrafts")
  },
  handler: async (ctx, args) => {
    const draft = await getDraftOrThrow(ctx, args.draftId);
    await assertCanAccessStorybook(ctx, draft.storybookId, "OWNER", args.viewerSubject);
    return toDraftDto(draft);
  }
});

export const beginVersion = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    chapterKey: v.string(),
    narration: narrationValidator,
    sourceAnswerIds: v.optional(v.array(v.string())),
    seedFromDraftId: v.optional(v.union(v.id("chapterDrafts"), v.null())),
    sectionPlan: v.optional(
      v.array(
        v.object({
          sectionId: v.string(),
          title: v.string()
        })
      )
    ),
    generationScope: v.optional(generationScopeValidator)
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    await assertChapterBelongsToStorybook(ctx, args.storybookId, args.chapterInstanceId);

    const existingGenerating = await ctx.db
      .query("chapterDrafts")
      .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", args.chapterInstanceId))
      .collect();
    if (existingGenerating.some((row) => row.status === "generating")) {
      return {
        ok: false as const,
        errorCode: "DRAFT_ALREADY_GENERATING" as const
      };
    }

    const seedDraft =
      args.seedFromDraftId != null ? await getDraftOrThrow(ctx, args.seedFromDraftId) : null;
    if (seedDraft && String(seedDraft.storybookId) !== String(args.storybookId)) {
      throw new Error("Seed draft does not belong to storybook");
    }
    if (seedDraft && String(seedDraft.chapterInstanceId) !== String(args.chapterInstanceId)) {
      throw new Error("Seed draft does not belong to chapter");
    }

    const now = Date.now();
    const version = await nextVersionForChapter(ctx, args.chapterInstanceId);

    const seededContent = seedDraft ? cloneDraftContent(seedDraft) : null;
    const initialSections = seededContent
      ? seededContent.sections
      : (args.sectionPlan ?? []).map((section) => ({
          sectionId: section.sectionId,
          title: section.title,
          text: "",
          wordCount: 0,
          citations: []
        }));

    const id = await ctx.db.insert("chapterDrafts", {
      storybookId: args.storybookId,
      chapterInstanceId: args.chapterInstanceId,
      chapterKey: args.chapterKey,
      version,
      status: "generating",
      narration: args.narration,
      sections: initialSections,
      summary: seededContent?.summary ?? "",
      keyFacts: seededContent?.keyFacts ?? [],
      quotes: seededContent?.quotes ?? [],
      entities: seededContent?.entities ?? emptyEntities(),
      imageIdeas: seededContent?.imageIdeas ?? [],
      sourceAnswerIds: args.sourceAnswerIds ?? seededContent?.sourceAnswerIds ?? [],
      warnings: seededContent?.warnings ?? [],
      generationScope: args.generationScope ?? { kind: "full" },
      errorCode: null,
      errorMessage: null,
      approvedAt: null,
      createdAt: now,
      updatedAt: now
    });
    await touchStorybook(ctx, args.storybookId, now);
    const draft = await ctx.db.get(id);
    if (!draft) throw new Error("Failed to create draft version");
    return { ok: true as const, draft: toDraftDto(draft) };
  }
});

export const setReady = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    draftId: v.id("chapterDrafts"),
    summary: v.string(),
    sections: v.array(sectionValidator),
    keyFacts: v.array(keyFactValidator),
    quotes: v.array(quoteValidator),
    entities: entitiesValidator,
    imageIdeas: v.array(imageIdeaValidator),
    sourceAnswerIds: v.array(v.string()),
    warnings: v.optional(v.array(warningValidator))
  },
  handler: async (ctx, args) => {
    const draft = await getDraftOrThrow(ctx, args.draftId);
    await assertCanAccessStorybook(ctx, draft.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    await ctx.db.patch(draft._id, {
      status: "ready",
      summary: args.summary,
      sections: normalizeSections(args.sections as ChapterDraftSection[]),
      keyFacts: args.keyFacts as ChapterDraftKeyFact[],
      quotes: args.quotes as ChapterDraftQuote[],
      entities: args.entities as ChapterDraftEntities,
      imageIdeas: args.imageIdeas as ChapterDraftImageIdea[],
      sourceAnswerIds: args.sourceAnswerIds,
      warnings: args.warnings ?? [],
      errorCode: null,
      errorMessage: null,
      updatedAt: now
    });
    await touchStorybook(ctx, draft.storybookId, now);
    const updated = await ctx.db.get(draft._id);
    if (!updated) throw new Error("Draft not found");
    return { ok: true as const, draft: toDraftDto(updated) };
  }
});

export const setError = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    draftId: v.id("chapterDrafts"),
    errorCode: v.string(),
    errorMessage: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    const draft = await getDraftOrThrow(ctx, args.draftId);
    await assertCanAccessStorybook(ctx, draft.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    await ctx.db.patch(draft._id, {
      status: "error",
      errorCode: args.errorCode,
      errorMessage: args.errorMessage ?? null,
      updatedAt: now
    });
    await touchStorybook(ctx, draft.storybookId, now);
    const updated = await ctx.db.get(draft._id);
    if (!updated) throw new Error("Draft not found");
    return { ok: true as const, draft: toDraftDto(updated) };
  }
});

export const approve = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    draftId: v.id("chapterDrafts")
  },
  handler: async (ctx, args) => {
    const draft = await getDraftOrThrow(ctx, args.draftId);
    await assertCanAccessStorybook(ctx, draft.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    await ctx.db.patch(draft._id, {
      approvedAt: now,
      updatedAt: now
    });
    await touchStorybook(ctx, draft.storybookId, now);
    return { ok: true as const, draftId: String(draft._id), approvedAt: now };
  }
});
