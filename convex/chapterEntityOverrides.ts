import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";

type ConvexCtx = MutationCtx | QueryCtx;

const personOverrideValidator = v.object({
  value: v.string(),
  kind: v.union(v.literal("person"), v.literal("role")),
  confidence: v.number(),
  citations: v.array(v.string()),
  source: v.literal("override")
});

const placeOverrideValidator = v.object({
  value: v.string(),
  confidence: v.number(),
  citations: v.array(v.string()),
  source: v.literal("override")
});

const dateOverrideValidator = v.object({
  value: v.string(),
  normalized: v.string(),
  confidence: v.number(),
  citations: v.array(v.string()),
  source: v.literal("override")
});

async function getChapterOrThrow(ctx: ConvexCtx, chapterInstanceId: Id<"storybookChapters">) {
  const chapter = await ctx.db.get(chapterInstanceId);
  if (!chapter) throw new Error("Chapter instance not found");
  return chapter;
}

async function getOverrideRow(ctx: ConvexCtx, chapterInstanceId: Id<"storybookChapters">) {
  return await ctx.db
    .query("chapterEntityOverrides")
    .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", chapterInstanceId))
    .first();
}

function normalizeValue(value: string) {
  return value.trim().replaceAll(/\s+/g, " ");
}

function normalizeRemoveKey(kind: "people" | "places" | "dates", value: string) {
  return `${kind}:${normalizeValue(value).toLowerCase()}`;
}

function toDto(row: Awaited<ReturnType<typeof getOverrideRow>>) {
  if (!row) return null;
  return {
    id: String(row._id),
    storybookId: String(row.storybookId),
    chapterInstanceId: String(row.chapterInstanceId),
    adds: row.adds,
    removes: row.removes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

async function ensureRow(ctx: MutationCtx, args: { storybookId: Id<"storybooks">; chapterInstanceId: Id<"storybookChapters"> }) {
  const existing = await getOverrideRow(ctx, args.chapterInstanceId);
  if (existing) return existing;
  const now = Date.now();
  const id = await ctx.db.insert("chapterEntityOverrides", {
    storybookId: args.storybookId,
    chapterInstanceId: args.chapterInstanceId,
    adds: { people: [], places: [], dates: [] },
    removes: [],
    createdAt: now,
    updatedAt: now
  });
  const row = await ctx.db.get(id);
  if (!row) throw new Error("Failed to create entity overrides");
  return row;
}

export const getByChapter = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);
    const row = await getOverrideRow(ctx, args.chapterInstanceId);
    return toDto(row);
  }
});

export const addPerson = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    entity: personOverrideValidator
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    if (String(chapter.storybookId) !== String(args.storybookId)) throw new Error("Chapter does not belong to storybook");
    const row = await ensureRow(ctx, args);
    const value = normalizeValue(args.entity.value);
    const nextPeople = [
      ...row.adds.people.filter((item) => item.value.toLowerCase() !== value.toLowerCase()),
      { ...args.entity, value }
    ];
    const removeKey = normalizeRemoveKey("people", value);
    const nextRemoves = row.removes.filter((item) => normalizeRemoveKey(item.kind, item.value) !== removeKey);
    await ctx.db.patch(row._id, {
      adds: { ...row.adds, people: nextPeople },
      removes: nextRemoves,
      updatedAt: Date.now()
    });
    const updated = await ctx.db.get(row._id);
    return { ok: true as const, overrides: toDto(updated)! };
  }
});

export const addPlace = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    entity: placeOverrideValidator
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    if (String(chapter.storybookId) !== String(args.storybookId)) throw new Error("Chapter does not belong to storybook");
    const row = await ensureRow(ctx, args);
    const value = normalizeValue(args.entity.value);
    const nextPlaces = [
      ...row.adds.places.filter((item) => item.value.toLowerCase() !== value.toLowerCase()),
      { ...args.entity, value }
    ];
    const removeKey = normalizeRemoveKey("places", value);
    const nextRemoves = row.removes.filter((item) => normalizeRemoveKey(item.kind, item.value) !== removeKey);
    await ctx.db.patch(row._id, {
      adds: { ...row.adds, places: nextPlaces },
      removes: nextRemoves,
      updatedAt: Date.now()
    });
    const updated = await ctx.db.get(row._id);
    return { ok: true as const, overrides: toDto(updated)! };
  }
});

export const addDate = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    entity: dateOverrideValidator
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    if (String(chapter.storybookId) !== String(args.storybookId)) throw new Error("Chapter does not belong to storybook");
    const row = await ensureRow(ctx, args);
    const value = normalizeValue(args.entity.value);
    const nextDates = [
      ...row.adds.dates.filter((item) => item.value.toLowerCase() !== value.toLowerCase()),
      { ...args.entity, value }
    ];
    const removeKey = normalizeRemoveKey("dates", value);
    const nextRemoves = row.removes.filter((item) => normalizeRemoveKey(item.kind, item.value) !== removeKey);
    await ctx.db.patch(row._id, {
      adds: { ...row.adds, dates: nextDates },
      removes: nextRemoves,
      updatedAt: Date.now()
    });
    const updated = await ctx.db.get(row._id);
    return { ok: true as const, overrides: toDto(updated)! };
  }
});

export const removeEntity = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    kind: v.union(v.literal("people"), v.literal("places"), v.literal("dates")),
    value: v.string()
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    if (String(chapter.storybookId) !== String(args.storybookId)) throw new Error("Chapter does not belong to storybook");
    const row = await ensureRow(ctx, args);
    const normalizedValue = normalizeValue(args.value);
    const removeKey = normalizeRemoveKey(args.kind, normalizedValue);
    const nextRemoves = [
      ...row.removes.filter((item) => normalizeRemoveKey(item.kind, item.value) !== removeKey),
      { kind: args.kind, value: normalizedValue }
    ];
    const nextAdds = {
      people: row.adds.people.filter((item) => !(args.kind === "people" && item.value.toLowerCase() === normalizedValue.toLowerCase())),
      places: row.adds.places.filter((item) => !(args.kind === "places" && item.value.toLowerCase() === normalizedValue.toLowerCase())),
      dates: row.adds.dates.filter((item) => !(args.kind === "dates" && item.value.toLowerCase() === normalizedValue.toLowerCase()))
    };
    await ctx.db.patch(row._id, {
      adds: nextAdds,
      removes: nextRemoves,
      updatedAt: Date.now()
    });
    const updated = await ctx.db.get(row._id);
    return { ok: true as const, overrides: toDto(updated)! };
  }
});

export const reset = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const row = await getOverrideRow(ctx, args.chapterInstanceId);
    if (!row) return { ok: true as const, overrides: null };
    await ctx.db.patch(row._id, {
      adds: { people: [], places: [], dates: [] },
      removes: [],
      updatedAt: Date.now()
    });
    const updated = await ctx.db.get(row._id);
    return { ok: true as const, overrides: toDto(updated) };
  }
});
