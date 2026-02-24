import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";

type ConvexCtx = MutationCtx | QueryCtx;

const blockTypeValidator = v.union(
  v.literal("TEXT"),
  v.literal("IMAGE"),
  v.literal("VIDEO"),
  v.literal("GIF"),
  v.literal("EMBED")
);

function toIso(value: number) {
  return new Date(value).toISOString();
}

function toBlockDto(doc: {
  _id: unknown;
  chapterId: unknown;
  storybookId: unknown;
  ownerId: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "GIF" | "EMBED";
  orderIndex: number;
  content?: unknown;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: String(doc._id),
    chapter_id: String(doc.chapterId),
    storybook_id: String(doc.storybookId),
    owner_id: doc.ownerId,
    type: doc.type,
    order_index: doc.orderIndex,
    content:
      doc.content && typeof doc.content === "object" && !Array.isArray(doc.content)
        ? (doc.content as Record<string, unknown>)
        : {},
    created_at: toIso(doc.createdAt),
    updated_at: toIso(doc.updatedAt)
  };
}

async function getChapterOrThrow(ctx: ConvexCtx, chapterId: Id<"chapters">): Promise<Doc<"chapters">> {
  const chapter = await ctx.db.get(chapterId);
  if (!chapter) throw new Error("Chapter not found");
  return chapter;
}

async function getBlockOrThrow(ctx: ConvexCtx, blockId: Id<"chapterBlocks">): Promise<Doc<"chapterBlocks">> {
  const block = await ctx.db.get(blockId);
  if (!block) throw new Error("Block not found");
  return block;
}

export const listByChapter = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterId: v.id("chapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "VIEWER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapterBlocks")
      .withIndex("by_chapterId_orderIndex", (q) => q.eq("chapterId", args.chapterId))
      .collect();

    return rows
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((row) => toBlockDto(row as never));
  }
});

export const insert = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterId: v.id("chapters"),
    type: blockTypeValidator,
    content: v.optional(v.any()),
    orderIndex: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterId);
    const access = await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapterBlocks")
      .withIndex("by_chapterId_orderIndex", (q) => q.eq("chapterId", args.chapterId))
      .collect();

    const requestedIndex =
      typeof args.orderIndex === "number"
        ? Math.max(0, Math.min(args.orderIndex, rows.length))
        : rows.length;
    const now = Date.now();

    const sorted = rows.sort((a, b) => a.orderIndex - b.orderIndex);
    for (const row of sorted) {
      if (row.orderIndex >= requestedIndex) {
        await ctx.db.patch(row._id, { orderIndex: row.orderIndex + 1, updatedAt: now });
      }
    }

    const blockId = await ctx.db.insert("chapterBlocks", {
      storybookId: chapter.storybookId,
      chapterId: args.chapterId,
      ownerId: access.storybook.ownerId,
      type: args.type,
      orderIndex: requestedIndex,
      content: args.content ?? {},
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    const block = await ctx.db.get(blockId);
    if (!block) throw new Error("Failed to create block");
    return toBlockDto(block as never);
  }
});

export const update = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    blockId: v.id("chapterBlocks"),
    patch: v.object({
      type: v.optional(blockTypeValidator),
      content: v.optional(v.any())
    })
  },
  handler: async (ctx, args) => {
    const block = await getBlockOrThrow(ctx, args.blockId);
    const access = await assertCanAccessStorybook(ctx, block.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };
    if (args.patch.type) patch.type = args.patch.type;
    if ("content" in args.patch) patch.content = args.patch.content ?? {};
    await ctx.db.patch(args.blockId, patch as never);
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    const updated = await ctx.db.get(args.blockId);
    if (!updated) throw new Error("Block not found");
    return toBlockDto(updated as never);
  }
});

export const remove = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    blockId: v.id("chapterBlocks")
  },
  handler: async (ctx, args) => {
    const block = await getBlockOrThrow(ctx, args.blockId);
    const access = await assertCanAccessStorybook(ctx, block.storybookId, "OWNER", args.viewerSubject);
    const chapterId = block.chapterId;
    await ctx.db.delete(args.blockId);

    const remaining = await ctx.db
      .query("chapterBlocks")
      .withIndex("by_chapterId_orderIndex", (q) => q.eq("chapterId", chapterId))
      .collect();
    const now = Date.now();
    for (const [index, row] of remaining.sort((a, b) => a.orderIndex - b.orderIndex).entries()) {
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
    chapterId: v.id("chapters"),
    orderedBlockIds: v.array(v.id("chapterBlocks"))
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterId);
    const access = await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapterBlocks")
      .withIndex("by_chapterId_orderIndex", (q) => q.eq("chapterId", args.chapterId))
      .collect();

    if (rows.length !== args.orderedBlockIds.length) throw new Error("Invalid reorder payload");
    const byId = new Map(rows.map((row) => [String(row._id), row]));
    for (const id of args.orderedBlockIds) {
      if (!byId.has(String(id))) throw new Error("Invalid reorder payload");
    }

    const now = Date.now();
    for (const [index, id] of args.orderedBlockIds.entries()) {
      const row = byId.get(String(id));
      if (row && row.orderIndex !== index) {
        await ctx.db.patch(row._id, { orderIndex: index, updatedAt: now });
      }
    }
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    return { ok: true };
  }
});

// Backward-compatible aliases for pre-S4 wrapper names.
export const listChapterBlocks = listByChapter;
export const insertBlock = insert;
export const updateBlock = update;
export const removeBlock = remove;
export const reorderBlocks = reorder;
