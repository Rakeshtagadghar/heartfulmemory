import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";

type ConvexCtx = MutationCtx | QueryCtx;

const chapterStatusValidator = v.union(v.literal("DRAFT"), v.literal("FINAL"));

function toIso(value: number) {
  return new Date(value).toISOString();
}

function normalizeTitle(title?: string | null) {
  const trimmed = title?.trim();
  return trimmed && trimmed.length > 0 ? trimmed.slice(0, 200) : "Untitled Chapter";
}

function toChapterDto(doc: {
  _id: unknown;
  storybookId: unknown;
  ownerId: string;
  title: string;
  status: "DRAFT" | "FINAL";
  orderIndex: number;
  summary?: string;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: String(doc._id),
    storybook_id: String(doc.storybookId),
    owner_id: doc.ownerId,
    title: doc.title,
    status: doc.status,
    order_index: doc.orderIndex,
    summary: doc.summary ?? null,
    created_at: toIso(doc.createdAt),
    updated_at: toIso(doc.updatedAt)
  };
}

async function getChapterOrThrow(ctx: ConvexCtx, chapterId: Id<"chapters">): Promise<Doc<"chapters">> {
  const chapter = await ctx.db.get(chapterId);
  if (!chapter) throw new Error("Chapter not found");
  return chapter;
}

export const create = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    title: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const existing = await ctx.db
      .query("chapters")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    const nextOrder =
      existing.length === 0 ? 0 : Math.max(...existing.map((chapter) => chapter.orderIndex)) + 1;

    const now = Date.now();
    const id = await ctx.db.insert("chapters", {
      storybookId: args.storybookId,
      ownerId: access.storybook.ownerId,
      title: normalizeTitle(args.title),
      status: "DRAFT",
      orderIndex: nextOrder,
      createdAt: now,
      updatedAt: now
    });
    const chapter = await ctx.db.get(id);
    if (!chapter) throw new Error("Failed to create chapter");
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    return toChapterDto(chapter as never);
  }
});

export const listByStorybook = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "VIEWER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapters")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    return rows
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((row) => toChapterDto(row as never));
  }
});

export const rename = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterId: v.id("chapters"),
    title: v.string()
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterId);
    const access = await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    await ctx.db.patch(args.chapterId, {
      title: normalizeTitle(args.title),
      updatedAt: now
    });
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    const updated = await ctx.db.get(args.chapterId);
    if (!updated) throw new Error("Chapter not found");
    return toChapterDto(updated as never);
  }
});

export const update = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterId: v.id("chapters"),
    patch: v.object({
      title: v.optional(v.string()),
      status: v.optional(chapterStatusValidator),
      summary: v.optional(v.union(v.string(), v.null()))
    })
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterId);
    const access = await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };
    if (typeof args.patch.title === "string") patch.title = normalizeTitle(args.patch.title);
    if (args.patch.status) patch.status = args.patch.status;
    if ("summary" in args.patch) patch.summary = args.patch.summary ?? undefined;

    await ctx.db.patch(args.chapterId, patch as never);
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    const updated = await ctx.db.get(args.chapterId);
    if (!updated) throw new Error("Chapter not found");
    return toChapterDto(updated as never);
  }
});

export const remove = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterId: v.id("chapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterId);
    const access = await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);

    const blocks = await ctx.db
      .query("chapterBlocks")
      .withIndex("by_chapterId_orderIndex", (q) => q.eq("chapterId", args.chapterId))
      .collect();
    for (const block of blocks) {
      await ctx.db.delete(block._id);
    }

    await ctx.db.delete(args.chapterId);

    const remaining = await ctx.db
      .query("chapters")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", chapter.storybookId))
      .collect();
    const now = Date.now();
    const ordered = remaining.sort((a, b) => a.orderIndex - b.orderIndex);
    for (const [index, row] of ordered.entries()) {
      if (row.orderIndex !== index) {
        await ctx.db.patch(row._id, { orderIndex: index, updatedAt: now });
      }
    }
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    return { ok: true };
  }
});

export const reorder = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    orderedChapterIds: v.array(v.id("chapters"))
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapters")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();

    if (rows.length !== args.orderedChapterIds.length) {
      throw new Error("Invalid reorder payload");
    }

    const byId = new Map(rows.map((row) => [String(row._id), row]));
    for (const id of args.orderedChapterIds) {
      if (!byId.has(String(id))) throw new Error("Invalid reorder payload");
    }

    const now = Date.now();
    for (const [index, id] of args.orderedChapterIds.entries()) {
      const row = byId.get(String(id));
      if (!row) continue;
      if (row.orderIndex !== index) {
        await ctx.db.patch(row._id, { orderIndex: index, updatedAt: now });
      }
    }
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    return { ok: true };
  }
});

// Backward-compatible aliases.
export const createChapter = create;
export const listChaptersByStorybook = listByStorybook;
export const renameChapter = rename;
export const removeChapter = remove;
export const reorderChapters = reorder;
