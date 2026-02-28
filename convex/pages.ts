import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";

type ConvexCtx = MutationCtx | QueryCtx;

const pageSizePresetValidator = v.union(
  v.literal("A4"),
  v.literal("US_LETTER"),
  v.literal("BOOK_6X9"),
  v.literal("BOOK_8_5X11")
);

const marginsValidator = v.object({
  top: v.number(),
  right: v.number(),
  bottom: v.number(),
  left: v.number(),
  unit: v.literal("px")
});

const gridValidator = v.object({
  enabled: v.boolean(),
  columns: v.number(),
  gutter: v.number(),
  rowHeight: v.number(),
  showGuides: v.boolean()
});

const backgroundValidator = v.object({
  fill: v.string()
});

const presetDimensions: Record<string, { widthPx: number; heightPx: number }> = {
  A4: { widthPx: 794, heightPx: 1123 },
  US_LETTER: { widthPx: 816, heightPx: 1056 },
  BOOK_6X9: { widthPx: 720, heightPx: 1080 },
  BOOK_8_5X11: { widthPx: 816, heightPx: 1056 }
};

function toIso(value: number) {
  return new Date(value).toISOString();
}

function toPageDto(doc: {
  _id: unknown;
  storybookId: unknown;
  ownerId: string;
  orderIndex: number;
  title?: string;
  isHidden?: boolean;
  isLocked?: boolean;
  sizePreset: "A4" | "US_LETTER" | "BOOK_6X9" | "BOOK_8_5X11";
  widthPx: number;
  heightPx: number;
  margins: { top: number; right: number; bottom: number; left: number; unit: "px" };
  grid: { enabled: boolean; columns: number; gutter: number; rowHeight: number; showGuides: boolean };
  background: { fill: string };
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: String(doc._id),
    storybook_id: String(doc.storybookId),
    owner_id: doc.ownerId,
    order_index: doc.orderIndex,
    title: doc.title ?? "",
    is_hidden: Boolean(doc.isHidden),
    is_locked: Boolean(doc.isLocked),
    size_preset: doc.sizePreset,
    width_px: doc.widthPx,
    height_px: doc.heightPx,
    margins: doc.margins,
    grid: doc.grid,
    background: doc.background,
    created_at: toIso(doc.createdAt),
    updated_at: toIso(doc.updatedAt)
  };
}

async function getPageOrThrow(ctx: ConvexCtx, pageId: Id<"pages">): Promise<Doc<"pages">> {
  const page = await ctx.db.get(pageId);
  if (!page) throw new Error("Page not found");
  return page;
}

export const listByStorybook = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "VIEWER", args.viewerSubject);
    const rows = await ctx.db
      .query("pages")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    return rows.sort((a, b) => a.orderIndex - b.orderIndex).map((row) => toPageDto(row as never));
  }
});

export const create = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    sizePreset: v.optional(pageSizePresetValidator),
    background: v.optional(backgroundValidator)
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const preset = args.sizePreset ?? "BOOK_8_5X11";
    const existing = await ctx.db
      .query("pages")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    const nextOrder =
      existing.length === 0 ? 0 : Math.max(...existing.map((page) => page.orderIndex)) + 1;
    const now = Date.now();
    const dimensions = presetDimensions[preset];
    const pageId = await ctx.db.insert("pages", {
      storybookId: args.storybookId,
      ownerId: access.storybook.ownerId,
      orderIndex: nextOrder,
      title: "",
      isHidden: false,
      isLocked: false,
      sizePreset: preset,
      widthPx: dimensions.widthPx,
      heightPx: dimensions.heightPx,
      margins: { top: 44, right: 44, bottom: 44, left: 44, unit: "px" },
      grid: { enabled: true, columns: 8, gutter: 12, rowHeight: 12, showGuides: true },
      background: args.background ?? { fill: "#ffffff" },
      createdAt: now,
      updatedAt: now
    });
    await ctx.db.patch(access.storybook._id as never, {
      updatedAt: now,
      settings: {
        ...(typeof access.storybook.settings === "object" && access.storybook.settings
          ? (access.storybook.settings as Record<string, unknown>)
          : {}),
        pageEditorEnabled: true
      }
    });
    const page = await ctx.db.get(pageId);
    if (!page) throw new Error("Failed to create page");
    return toPageDto(page as never);
  }
});

export const update = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    pageId: v.id("pages"),
    patch: v.object({
      title: v.optional(v.string()),
      isHidden: v.optional(v.boolean()),
      isLocked: v.optional(v.boolean()),
      sizePreset: v.optional(pageSizePresetValidator),
      margins: v.optional(marginsValidator),
      grid: v.optional(gridValidator),
      background: v.optional(backgroundValidator)
    })
  },
  handler: async (ctx, args) => {
    const page = await getPageOrThrow(ctx, args.pageId);
    const access = await assertCanAccessStorybook(ctx, page.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };
    if (args.patch.sizePreset) {
      patch.sizePreset = args.patch.sizePreset;
      patch.widthPx = presetDimensions[args.patch.sizePreset].widthPx;
      patch.heightPx = presetDimensions[args.patch.sizePreset].heightPx;
    }
    if ("title" in args.patch && typeof args.patch.title === "string") patch.title = args.patch.title;
    if ("isHidden" in args.patch && typeof args.patch.isHidden === "boolean") patch.isHidden = args.patch.isHidden;
    if ("isLocked" in args.patch && typeof args.patch.isLocked === "boolean") patch.isLocked = args.patch.isLocked;
    if (args.patch.margins) patch.margins = args.patch.margins;
    if (args.patch.grid) patch.grid = args.patch.grid;
    if (args.patch.background) patch.background = args.patch.background;
    await ctx.db.patch(args.pageId, patch as never);
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    const updated = await ctx.db.get(args.pageId);
    if (!updated) throw new Error("Page not found");
    return toPageDto(updated as never);
  }
});

export const reorder = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    orderedPageIds: v.array(v.id("pages"))
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("pages")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    if (rows.length !== args.orderedPageIds.length) throw new Error("Invalid reorder payload");
    const byId = new Map(rows.map((row) => [String(row._id), row]));
    for (const id of args.orderedPageIds) {
      if (!byId.has(String(id))) throw new Error("Invalid reorder payload");
    }

    const now = Date.now();
    for (const [index, pageId] of args.orderedPageIds.entries()) {
      const row = byId.get(String(pageId));
      if (row && row.orderIndex !== index) {
        await ctx.db.patch(row._id, { orderIndex: index, updatedAt: now });
      }
    }
    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    return { ok: true };
  }
});

export const remove = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    pageId: v.id("pages")
  },
  handler: async (ctx, args) => {
    const page = await getPageOrThrow(ctx, args.pageId);
    const access = await assertCanAccessStorybook(ctx, page.storybookId, "OWNER", args.viewerSubject);
    const frames = await ctx.db
      .query("frames")
      .withIndex("by_pageId_zIndex", (q) => q.eq("pageId", args.pageId))
      .collect();
    for (const frame of frames) {
      await ctx.db.delete(frame._id);
    }
    await ctx.db.delete(args.pageId);

    const remaining = await ctx.db
      .query("pages")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", page.storybookId))
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

export const duplicate = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    pageId: v.id("pages")
  },
  handler: async (ctx, args) => {
    const sourcePage = await getPageOrThrow(ctx, args.pageId);
    const access = await assertCanAccessStorybook(ctx, sourcePage.storybookId, "OWNER", args.viewerSubject);
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", sourcePage.storybookId))
      .collect();
    const orderedPages = pages.sort((a, b) => a.orderIndex - b.orderIndex);
    const sourceIndex = orderedPages.findIndex((page) => String(page._id) === String(sourcePage._id));
    if (sourceIndex < 0) throw new Error("Page not found in storybook order");

    const now = Date.now();
    for (const page of orderedPages.slice(sourceIndex + 1)) {
      await ctx.db.patch(page._id, { orderIndex: page.orderIndex + 1, updatedAt: now });
    }

    const duplicatedPageId = await ctx.db.insert("pages", {
      storybookId: sourcePage.storybookId,
      ownerId: sourcePage.ownerId,
      orderIndex: sourcePage.orderIndex + 1,
      title: sourcePage.title ?? "",
      isHidden: sourcePage.isHidden ?? false,
      isLocked: sourcePage.isLocked ?? false,
      sizePreset: sourcePage.sizePreset,
      widthPx: sourcePage.widthPx,
      heightPx: sourcePage.heightPx,
      margins: sourcePage.margins,
      grid: sourcePage.grid,
      background: sourcePage.background,
      createdAt: now,
      updatedAt: now
    });

    const sourceFrames = await ctx.db
      .query("frames")
      .withIndex("by_pageId_zIndex", (q) => q.eq("pageId", sourcePage._id))
      .collect();
    const orderedFrames = sourceFrames.sort((a, b) => a.zIndex - b.zIndex);
    for (const frame of orderedFrames) {
      await ctx.db.insert("frames", {
        storybookId: frame.storybookId,
        pageId: duplicatedPageId,
        ownerId: frame.ownerId,
        type: frame.type,
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        zIndex: frame.zIndex,
        locked: frame.locked,
        style: frame.style,
        content: frame.content,
        crop: frame.crop,
        version: 1,
        createdAt: now,
        updatedAt: now
      });
    }

    await ctx.db.patch(access.storybook._id as never, { updatedAt: now });
    const duplicated = await ctx.db.get(duplicatedPageId);
    if (!duplicated) throw new Error("Failed to duplicate page");
    return toPageDto(duplicated as never);
  }
});

export const createDefaultCanvas = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const existingPages = await ctx.db
      .query("pages")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    if (existingPages.length > 0) {
      return existingPages.sort((a, b) => a.orderIndex - b.orderIndex).map((row) => toPageDto(row as never));
    }

    const now = Date.now();
    const pageId = await ctx.db.insert("pages", {
      storybookId: args.storybookId,
      ownerId: access.storybook.ownerId,
      orderIndex: 0,
      title: access.storybook.title || "Cover",
      isHidden: false,
      isLocked: false,
      sizePreset: "BOOK_8_5X11",
      widthPx: 816,
      heightPx: 1056,
      margins: { top: 44, right: 44, bottom: 44, left: 44, unit: "px" },
      grid: { enabled: true, columns: 8, gutter: 12, rowHeight: 12, showGuides: true },
      background: { fill: "#fbfaf6" },
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.insert("frames", {
      storybookId: args.storybookId,
      pageId,
      ownerId: access.storybook.ownerId,
      type: "TEXT",
      x: 60,
      y: 64,
      w: 696,
      h: 120,
      zIndex: 1,
      locked: false,
      style: {
        fontFamily: "serif",
        fontSize: 34,
        lineHeight: 1.15,
        fontWeight: 700,
        color: "#1e2430",
        align: "left"
      },
      content: { kind: "text_frame_v1", text: access.storybook.title || "Memorioso Storybook" },
      version: 1,
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.insert("frames", {
      storybookId: args.storybookId,
      pageId,
      ownerId: access.storybook.ownerId,
      type: "IMAGE",
      x: 60,
      y: 212,
      w: 300,
      h: 380,
      zIndex: 2,
      locked: false,
      style: { borderRadius: 18, borderColor: "#d6c090", borderWidth: 1, shadow: "soft" },
      content: { kind: "image_frame_v1", caption: "Cover image placeholder", placeholderLabel: "Add cover image" },
      crop: { x: 0, y: 0, scale: 1, focalX: 0.5, focalY: 0.5 },
      version: 1,
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.insert("frames", {
      storybookId: args.storybookId,
      pageId,
      ownerId: access.storybook.ownerId,
      type: "TEXT",
      x: 384,
      y: 212,
      w: 372,
      h: 380,
      zIndex: 3,
      locked: false,
      style: {
        fontFamily: "sans",
        fontSize: 15,
        lineHeight: 1.45,
        fontWeight: 400,
        color: "#293040",
        align: "left"
      },
      content: {
        kind: "text_frame_v1",
        text:
          "Start with a meaningful moment. This could be a memory, an idea, a lesson, or anything you want to explore. Use the tools on the left to customize this page and bring your story to life."
      },
      version: 1,
      createdAt: now,
      updatedAt: now
    });

    const rows = await ctx.db
      .query("pages")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    return rows.sort((a, b) => a.orderIndex - b.orderIndex).map((row) => toPageDto(row as never));
  }
});
