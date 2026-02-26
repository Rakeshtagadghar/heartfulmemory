import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";

type Ctx = MutationCtx | QueryCtx;
type ChapterStudioStateDoc = Doc<"chapterStudioState">;

const statusValidator = v.union(
  v.literal("not_started"),
  v.literal("populated"),
  v.literal("edited"),
  v.literal("finalized")
);

type ChapterStudioStatus = "not_started" | "populated" | "edited" | "finalized";

const statusRank: Record<ChapterStudioStatus, number> = {
  not_started: 0,
  populated: 1,
  edited: 2,
  finalized: 3
};

function toDto(doc: ChapterStudioStateDoc) {
  return {
    id: String(doc._id),
    storybookId: String(doc.storybookId),
    chapterInstanceId: String(doc.chapterInstanceId),
    chapterKey: doc.chapterKey,
    status: doc.status,
    lastAppliedDraftVersion: doc.lastAppliedDraftVersion ?? null,
    lastAppliedIllustrationVersion: doc.lastAppliedIllustrationVersion ?? null,
    pageIds: doc.pageIds,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

async function getChapterOrThrow(ctx: Ctx, chapterInstanceId: Id<"storybookChapters">) {
  const row = await ctx.db.get(chapterInstanceId);
  if (!row) throw new Error("Chapter instance not found");
  return row;
}

async function getStateByChapter(ctx: Ctx, chapterInstanceId: Id<"storybookChapters">) {
  return ctx.db
    .query("chapterStudioState")
    .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", chapterInstanceId))
    .unique();
}

async function touchStorybook(ctx: MutationCtx, storybookId: Id<"storybooks">, at = Date.now()) {
  await ctx.db.patch(storybookId, { updatedAt: at });
}

function promoteStatus(current: ChapterStudioStatus, next: ChapterStudioStatus): ChapterStudioStatus {
  return statusRank[next] > statusRank[current] ? next : current;
}

export const listByStorybook = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "VIEWER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapterStudioState")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    return rows
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(toDto);
  }
});

export const getByChapterInstance = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "VIEWER", args.viewerSubject);
    const row = await getStateByChapter(ctx, args.chapterInstanceId);
    return row ? toDto(row) : null;
  }
});

export const upsertPopulationState = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    chapterKey: v.string(),
    status: v.optional(statusValidator),
    lastAppliedDraftVersion: v.optional(v.union(v.number(), v.null())),
    lastAppliedIllustrationVersion: v.optional(v.union(v.number(), v.null())),
    pageIds: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    if (String(chapter.storybookId) !== String(args.storybookId)) {
      throw new Error("Chapter does not belong to storybook");
    }

    const existing = await getStateByChapter(ctx, args.chapterInstanceId);
    const now = Date.now();
    const requestedStatus = args.status ?? "populated";

    if (!existing) {
      const id = await ctx.db.insert("chapterStudioState", {
        storybookId: args.storybookId,
        chapterInstanceId: args.chapterInstanceId,
        chapterKey: args.chapterKey,
        status: requestedStatus,
        lastAppliedDraftVersion: args.lastAppliedDraftVersion ?? null,
        lastAppliedIllustrationVersion: args.lastAppliedIllustrationVersion ?? null,
        pageIds: args.pageIds ?? [],
        createdAt: now,
        updatedAt: now
      });
      await touchStorybook(ctx, args.storybookId, now);
      const created = await ctx.db.get(id);
      if (!created) throw new Error("Failed to create chapter studio state");
      return { ok: true as const, state: toDto(created) };
    }

    const nextStatus = promoteStatus(existing.status, requestedStatus);
    await ctx.db.patch(existing._id, {
      chapterKey: args.chapterKey || existing.chapterKey,
      status: nextStatus,
      lastAppliedDraftVersion:
        "lastAppliedDraftVersion" in args ? (args.lastAppliedDraftVersion ?? null) : existing.lastAppliedDraftVersion ?? null,
      lastAppliedIllustrationVersion:
        "lastAppliedIllustrationVersion" in args
          ? (args.lastAppliedIllustrationVersion ?? null)
          : existing.lastAppliedIllustrationVersion ?? null,
      pageIds: args.pageIds ?? existing.pageIds,
      updatedAt: now
    });
    await touchStorybook(ctx, args.storybookId, now);
    const updated = await ctx.db.get(existing._id);
    if (!updated) throw new Error("Chapter studio state not found");
    return { ok: true as const, state: toDto(updated) };
  }
});

export const markEdited = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    if (String(chapter.storybookId) !== String(args.storybookId)) {
      throw new Error("Chapter does not belong to storybook");
    }
    const existing = await getStateByChapter(ctx, args.chapterInstanceId);
    const now = Date.now();

    if (!existing) {
      const id = await ctx.db.insert("chapterStudioState", {
        storybookId: args.storybookId,
        chapterInstanceId: args.chapterInstanceId,
        chapterKey: chapter.chapterKey,
        status: "edited",
        lastAppliedDraftVersion: null,
        lastAppliedIllustrationVersion: null,
        pageIds: [],
        createdAt: now,
        updatedAt: now
      });
      await touchStorybook(ctx, args.storybookId, now);
      const created = await ctx.db.get(id);
      if (!created) throw new Error("Failed to create chapter studio state");
      return { ok: true as const, state: toDto(created) };
    }

    const nextStatus = promoteStatus(existing.status, "edited");
    if (nextStatus !== existing.status) {
      await ctx.db.patch(existing._id, { status: nextStatus, updatedAt: now });
      await touchStorybook(ctx, args.storybookId, now);
    }
    const updated = await ctx.db.get(existing._id);
    if (!updated) throw new Error("Chapter studio state not found");
    return { ok: true as const, state: toDto(updated) };
  }
});

export const markFinalized = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    if (String(chapter.storybookId) !== String(args.storybookId)) {
      throw new Error("Chapter does not belong to storybook");
    }
    const existing = await getStateByChapter(ctx, args.chapterInstanceId);
    const now = Date.now();

    if (!existing) {
      const id = await ctx.db.insert("chapterStudioState", {
        storybookId: args.storybookId,
        chapterInstanceId: args.chapterInstanceId,
        chapterKey: chapter.chapterKey,
        status: "finalized",
        lastAppliedDraftVersion: null,
        lastAppliedIllustrationVersion: null,
        pageIds: [],
        createdAt: now,
        updatedAt: now
      });
      await touchStorybook(ctx, args.storybookId, now);
      const created = await ctx.db.get(id);
      if (!created) throw new Error("Failed to create chapter studio state");
      return { ok: true as const, state: toDto(created) };
    }

    const nextStatus = promoteStatus(existing.status, "finalized");
    if (nextStatus !== existing.status) {
      await ctx.db.patch(existing._id, { status: nextStatus, updatedAt: now });
      await touchStorybook(ctx, args.storybookId, now);
    }
    const updated = await ctx.db.get(existing._id);
    if (!updated) throw new Error("Chapter studio state not found");
    return { ok: true as const, state: toDto(updated) };
  }
});
