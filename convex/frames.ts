import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";

type ConvexCtx = MutationCtx | QueryCtx;

const frameTypeValidator = v.union(
  v.literal("TEXT"),
  v.literal("IMAGE"),
  v.literal("SHAPE"),
  v.literal("LINE"),
  v.literal("FRAME"),
  v.literal("GROUP")
);
type SupportedFrameType = "TEXT" | "IMAGE" | "SHAPE" | "LINE" | "FRAME" | "GROUP";

function toIso(value: number) {
  return new Date(value).toISOString();
}

function getDefaultFrameWidth(type: SupportedFrameType) {
  if (type === "TEXT") return 320;
  if (type === "LINE") return 240;
  if (type === "GROUP") return 560;
  return 280;
}

function getDefaultFrameHeight(type: SupportedFrameType) {
  if (type === "TEXT") return 120;
  if (type === "LINE") return 24;
  if (type === "GROUP") return 320;
  return 220;
}

function getDefaultFrameContent(type: SupportedFrameType) {
  if (type === "TEXT") {
    return { kind: "text_frame_v1", text: "Edit this frame..." };
  }
  if (type === "IMAGE") {
    return {
      kind: "image_frame_v1",
      caption: "",
      placeholderLabel: "Image placeholder"
    };
  }
  if (type === "FRAME") {
    return {
      kind: "frame_node_v1",
      placeholderLabel: "Frame placeholder",
      imageRef: null
    };
  }
  if (type === "SHAPE") {
    return { kind: "shape_node_v1", shapeType: "rect" };
  }
  if (type === "LINE") {
    return { kind: "line_node_v1" };
  }
  return {
    kind: "grid_group_v1",
    layoutHint: "grid",
    columns: 2,
    rows: 2,
    gap: 16,
    padding: 16,
    childrenIds: ["cell_1", "cell_2", "cell_3", "cell_4"],
    cells: [
      { id: "cell_1", row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      { id: "cell_2", row: 0, col: 1, rowSpan: 1, colSpan: 1 },
      { id: "cell_3", row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      { id: "cell_4", row: 1, col: 1, rowSpan: 1, colSpan: 1 }
    ]
  };
}

function toFrameDto(doc: {
  _id: unknown;
  storybookId: unknown;
  pageId: unknown;
  ownerId: string;
  type: SupportedFrameType;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  locked: boolean;
  style?: unknown;
  content?: unknown;
  crop?: unknown;
  version?: number;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: String(doc._id),
    storybook_id: String(doc.storybookId),
    page_id: String(doc.pageId),
    owner_id: doc.ownerId,
    type: doc.type,
    x: doc.x,
    y: doc.y,
    w: doc.w,
    h: doc.h,
    z_index: doc.zIndex,
    locked: doc.locked,
    style: doc.style && typeof doc.style === "object" && !Array.isArray(doc.style) ? (doc.style as Record<string, unknown>) : {},
    content:
      doc.content && typeof doc.content === "object" && !Array.isArray(doc.content)
        ? (doc.content as Record<string, unknown>)
        : {},
    crop: doc.crop && typeof doc.crop === "object" && !Array.isArray(doc.crop) ? (doc.crop as Record<string, unknown>) : null,
    version: doc.version ?? 1,
    created_at: toIso(doc.createdAt),
    updated_at: toIso(doc.updatedAt)
  };
}

async function getFrameOrThrow(ctx: ConvexCtx, frameId: Id<"frames">): Promise<Doc<"frames">> {
  const frame = await ctx.db.get(frameId);
  if (!frame) throw new Error("Frame not found");
  return frame;
}

async function getPageOrThrow(ctx: ConvexCtx, pageId: Id<"pages">): Promise<Doc<"pages">> {
  const page = await ctx.db.get(pageId);
  if (!page) throw new Error("Page not found");
  return page;
}

export const listByPage = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    pageId: v.id("pages")
  },
  handler: async (ctx, args) => {
    const page = await getPageOrThrow(ctx, args.pageId);
    await assertCanAccessStorybook(ctx, page.storybookId, "VIEWER", args.viewerSubject);
    const rows = await ctx.db
      .query("frames")
      .withIndex("by_pageId_zIndex", (q) => q.eq("pageId", args.pageId))
      .collect();
    return rows.sort((a, b) => a.zIndex - b.zIndex).map((row) => toFrameDto(row as never));
  }
});

export const create = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    pageId: v.id("pages"),
    type: frameTypeValidator,
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    w: v.optional(v.number()),
    h: v.optional(v.number()),
    zIndex: v.optional(v.number()),
    locked: v.optional(v.boolean()),
    style: v.optional(v.any()),
    content: v.optional(v.any()),
    crop: v.optional(v.any())
  },
  handler: async (ctx, args) => {// NOSONAR
    const page = await getPageOrThrow(ctx, args.pageId);
    const access = await assertCanAccessStorybook(
      ctx,
      page.storybookId,
      "OWNER",
      args.viewerSubject,
    );
    const rows = await ctx.db
      .query("frames")
      .withIndex("by_pageId_zIndex", (q) => q.eq("pageId", args.pageId))
      .collect();
    const nextZ =
      typeof args.zIndex === "number"
        ? args.zIndex
        : (rows.at(-1)?.zIndex ?? 0) + 1;
    const now = Date.now();
    const frameId = await ctx.db.insert("frames", {
      storybookId: page.storybookId,
      pageId: args.pageId,
      ownerId: access.storybook.ownerId,
      type: args.type,
      x: args.x ?? 80,
      y: args.y ?? 80,
      w: args.w ?? getDefaultFrameWidth(args.type),
      h: args.h ?? getDefaultFrameHeight(args.type),
      zIndex: nextZ,
      locked: args.locked ?? false,
      style: args.style ?? {},
      content: args.content ?? getDefaultFrameContent(args.type),
      crop: args.crop ?? null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    const frame = await ctx.db.get(frameId);
    if (!frame) throw new Error("Failed to create frame");
    return toFrameDto(frame as never);
  }
});

export const update = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    frameId: v.id("frames"),
    patch: v.object({
      x: v.optional(v.number()),
      y: v.optional(v.number()),
      w: v.optional(v.number()),
      h: v.optional(v.number()),
      z_index: v.optional(v.number()),
      locked: v.optional(v.boolean()),
      style: v.optional(v.any()),
      content: v.optional(v.any()),
      crop: v.optional(v.any()),
      expectedVersion: v.optional(v.number())
    })
  },
  handler: async (ctx, args) => {
    const frame = await getFrameOrThrow(ctx, args.frameId);
    const access = await assertCanAccessStorybook(ctx, frame.storybookId, "OWNER", args.viewerSubject);
    const currentVersion = frame.version ?? 1;
    if (
      typeof args.patch.expectedVersion === "number" &&
      args.patch.expectedVersion !== currentVersion
    ) {
      throw new Error(`CONFLICT:frame_version_mismatch:${currentVersion}`);
    }
    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now, version: currentVersion + 1 };
    if (typeof args.patch.x === "number") patch.x = args.patch.x;
    if (typeof args.patch.y === "number") patch.y = args.patch.y;
    if (typeof args.patch.w === "number") patch.w = Math.max(40, args.patch.w);
    if (typeof args.patch.h === "number") patch.h = Math.max(40, args.patch.h);
    if (typeof args.patch.z_index === "number") patch.zIndex = args.patch.z_index;
    if (typeof args.patch.locked === "boolean") patch.locked = args.patch.locked;
    if ("style" in args.patch) patch.style = args.patch.style ?? {};
    if ("content" in args.patch) patch.content = args.patch.content ?? {};
    if ("crop" in args.patch) patch.crop = args.patch.crop ?? null;
    await ctx.db.patch(args.frameId, patch as never);
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    const updated = await ctx.db.get(args.frameId);
    if (!updated) throw new Error("Frame not found");
    return toFrameDto(updated as never);
  }
});

export const remove = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    frameId: v.id("frames")
  },
  handler: async (ctx, args) => {
    const frame = await getFrameOrThrow(ctx, args.frameId);
    const access = await assertCanAccessStorybook(ctx, frame.storybookId, "OWNER", args.viewerSubject);
    const pageId = frame.pageId;
    await ctx.db.delete(args.frameId);
    const remaining = await ctx.db
      .query("frames")
      .withIndex("by_pageId_zIndex", (q) => q.eq("pageId", pageId))
      .collect();
    const now = Date.now();
    for (const [index, row] of remaining.sort((a, b) => a.zIndex - b.zIndex).entries()) {
      const targetZ = index + 1;
      if (row.zIndex !== targetZ) {
        await ctx.db.patch(row._id, { zIndex: targetZ, updatedAt: now });
      }
    }
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    return { ok: true };
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
      .query("frames")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    return rows.map((row) => toFrameDto(row as never));
  }
});
