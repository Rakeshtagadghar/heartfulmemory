import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";
import { getSectionFrameworkForChapterKey } from "../packages/shared/templates/sectionFramework";
import type {
  ChapterDraftEntities,
  ChapterDraftGenerationScope,
  ChapterDraftImageIdea,
  ChapterDraftKeyFact,
  ChapterDraftQuote,
  ChapterDraftSection,
  DraftNarrationSettings
} from "../packages/shared/drafts/draftTypes";
import type {
  ChapterDraftEntitiesV2,
  EntityDateV2,
  EntityPersonV2,
  EntityPlaceV2
} from "../packages/shared/entities/entitiesTypes";

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
  guidance: v.optional(v.string()),
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

const entitiesV2Validator = v.object({
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
    sections: normalizeSections(doc.chapterKey, doc.sections as ChapterDraftSection[]),
    summary: doc.summary,
    keyFacts: doc.keyFacts,
    quotes: doc.quotes,
    entities: doc.entities,
    entitiesV2: normalizeEntitiesV2(doc.entitiesV2),
    imageIdeas: doc.imageIdeas,
    answersHash: typeof doc.answersHash === "string" ? doc.answersHash : null,
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

function normalizeEntityPersonV2(value: unknown): EntityPersonV2 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.value !== "string") return null;
  if (row.kind !== "person" && row.kind !== "role") return null;
  if (typeof row.confidence !== "number" || !Number.isFinite(row.confidence)) return null;
  if (!Array.isArray(row.citations) || row.citations.some((item) => typeof item !== "string")) return null;
  if (row.source !== "llm" && row.source !== "override") return null;
  return {
    value: row.value,
    kind: row.kind,
    confidence: row.confidence,
    citations: [...(row.citations as string[])],
    source: row.source
  };
}

function normalizeEntityPlaceV2(value: unknown): EntityPlaceV2 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.value !== "string") return null;
  if (typeof row.confidence !== "number" || !Number.isFinite(row.confidence)) return null;
  if (!Array.isArray(row.citations) || row.citations.some((item) => typeof item !== "string")) return null;
  if (row.source !== "llm" && row.source !== "override") return null;
  return {
    value: row.value,
    confidence: row.confidence,
    citations: [...(row.citations as string[])],
    source: row.source
  };
}

function normalizeEntityDateV2(value: unknown): EntityDateV2 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.value !== "string" || typeof row.normalized !== "string") return null;
  if (typeof row.confidence !== "number" || !Number.isFinite(row.confidence)) return null;
  if (!Array.isArray(row.citations) || row.citations.some((item) => typeof item !== "string")) return null;
  if (row.source !== "llm" && row.source !== "override") return null;
  return {
    value: row.value,
    normalized: row.normalized,
    confidence: row.confidence,
    citations: [...(row.citations as string[])],
    source: row.source
  };
}

function normalizeEntitiesV2(value: unknown): ChapterDraftEntitiesV2 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (!Array.isArray(input.people) || !Array.isArray(input.places) || !Array.isArray(input.dates)) return null;
  if (!input.meta || typeof input.meta !== "object" || Array.isArray(input.meta)) return null;
  const meta = input.meta as Record<string, unknown>;
  if (meta.version !== 2) return null;
  if (typeof meta.generatedAt !== "number" || !Number.isFinite(meta.generatedAt)) return null;
  if (meta.generator !== "llm_extractor_v2") return null;

  const people = input.people.map(normalizeEntityPersonV2).filter((row): row is EntityPersonV2 => row !== null);
  const places = input.places.map(normalizeEntityPlaceV2).filter((row): row is EntityPlaceV2 => row !== null);
  const dates = input.dates.map(normalizeEntityDateV2).filter((row): row is EntityDateV2 => row !== null);

  if (people.length !== input.people.length || places.length !== input.places.length || dates.length !== input.dates.length) {
    return null;
  }

  return {
    people,
    places,
    dates,
    meta: {
      version: 2,
      generatedAt: meta.generatedAt,
      generator: "llm_extractor_v2"
    }
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

function getGuidanceMapForChapterKey(chapterKey: string) {
  const map = new Map<string, string>();
  for (const section of getSectionFrameworkForChapterKey(chapterKey)) {
    map.set(section.sectionId, section.guidance);
  }
  return map;
}

function normalizeSections(chapterKey: string, sections: ChapterDraftSection[]): ChapterDraftSection[] {
  const guidanceMap = getGuidanceMapForChapterKey(chapterKey);
  return sections.map((section) => ({
    ...section,
    guidance: typeof section.guidance === "string" ? section.guidance : guidanceMap.get(section.sectionId) ?? "",
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
    entitiesV2: normalizeEntitiesV2(doc.entitiesV2),
    imageIdeas: doc.imageIdeas.map((idea) => ({ ...idea })),
    answersHash: typeof doc.answersHash === "string" ? doc.answersHash : null,
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
          title: v.string(),
          guidance: v.optional(v.string())
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
    if (seedDraft) {
      if (String(seedDraft.storybookId) !== String(args.storybookId)) {
        throw new Error("Seed draft does not belong to storybook");
      }
      if (String(seedDraft.chapterInstanceId) !== String(args.chapterInstanceId)) {
        throw new Error("Seed draft does not belong to chapter");
      }
    }

    const now = Date.now();
    const version = await nextVersionForChapter(ctx, args.chapterInstanceId);

    const seededContent = seedDraft ? cloneDraftContent(seedDraft) : null;
    const initialSections = seededContent
      ? seededContent.sections
      : (args.sectionPlan ?? []).map((section) => ({
          sectionId: section.sectionId,
          title: section.title,
          guidance: section.guidance ?? "",
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
      ...(seededContent?.answersHash ? { answersHash: seededContent.answersHash } : {}),
      sourceAnswerIds: args.sourceAnswerIds ?? seededContent?.sourceAnswerIds ?? [],
      warnings: seededContent?.warnings ?? [],
      generationScope: args.generationScope ?? { kind: "full" },
      errorCode: null,
      errorMessage: null,
      approvedAt: null,
      createdAt: now,
      updatedAt: now,
      ...(seededContent?.entitiesV2 ? { entitiesV2: seededContent.entitiesV2 } : {})
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
    entitiesV2: v.optional(entitiesV2Validator),
    imageIdeas: v.array(imageIdeaValidator),
    answersHash: v.optional(v.string()),
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
      sections: normalizeSections(draft.chapterKey, args.sections as ChapterDraftSection[]),
      keyFacts: args.keyFacts as ChapterDraftKeyFact[],
      quotes: args.quotes as ChapterDraftQuote[],
      entities: args.entities as ChapterDraftEntities,
      imageIdeas: args.imageIdeas as ChapterDraftImageIdea[],
      ...(args.answersHash ? { answersHash: args.answersHash } : {}),
      sourceAnswerIds: args.sourceAnswerIds,
      warnings: args.warnings ?? [],
      errorCode: null,
      errorMessage: null,
      updatedAt: now,
      ...(args.entitiesV2 ? { entitiesV2: args.entitiesV2 as ChapterDraftEntitiesV2 } : {})
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
