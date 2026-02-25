import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";

function toIso(value: number) {
  return new Date(value).toISOString();
}

export const getPdfExportPayload = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    const frames = await ctx.db
      .query("frames")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", access.storybook.ownerId))
      .collect();

    return {
      storybook: {
        id: String(access.storybook._id),
        title: access.storybook.title,
        subtitle: access.storybook.subtitle ?? null,
        updated_at: toIso(access.storybook.updatedAt),
        settings:
          access.storybook.settings && typeof access.storybook.settings === "object" && !Array.isArray(access.storybook.settings)
            ? access.storybook.settings
            : {}
      },
      pages: pages
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((page) => ({
          id: String(page._id),
          storybook_id: String(page.storybookId),
          order_index: page.orderIndex,
          size_preset: page.sizePreset,
          width_px: page.widthPx,
          height_px: page.heightPx,
          margins: page.margins,
          grid: page.grid,
          background: page.background,
          updated_at: toIso(page.updatedAt)
        })),
      frames: frames.map((frame) => ({
        id: String(frame._id),
        storybook_id: String(frame.storybookId),
        page_id: String(frame.pageId),
        type: frame.type,
        x: frame.x,
        y: frame.y,
        w: frame.w,
        h: frame.h,
        z_index: frame.zIndex,
        locked: frame.locked,
        style: frame.style ?? {},
        content: frame.content ?? {},
        crop: frame.crop ?? null,
        version: frame.version ?? 1,
        updated_at: toIso(frame.updatedAt)
      })),
      assets: assets.map((asset) => ({
        id: String(asset._id),
        source: asset.source,
        sourceUrl: asset.sourceUrl ?? null,
        storageProvider: asset.storageProvider ?? null,
        storageKey: asset.storageKey ?? null,
        width: asset.width ?? null,
        height: asset.height ?? null,
        mimeType: asset.mimeType ?? null,
        license:
          asset.license && typeof asset.license === "object" && !Array.isArray(asset.license)
            ? (asset.license as Record<string, unknown>)
            : null
      }))
    };
  }
});

export const recordExportAttempt = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    exportTarget: v.union(v.literal("DIGITAL_PDF"), v.literal("HARDCOPY_PRINT_PDF")),
    exportHash: v.string(),
    status: v.union(v.literal("SUCCESS"), v.literal("FAILED")),
    pageCount: v.number(),
    warningsCount: v.number(),
    runtimeMs: v.optional(v.number()),
    fileKey: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    errorSummary: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const createdAt = Date.now();
    const id = await ctx.db.insert("exports", {
      storybookId: args.storybookId,
      ownerId: access.storybook.ownerId,
      exportTarget: args.exportTarget,
      exportHash: args.exportHash,
      status: args.status,
      pageCount: args.pageCount,
      warningsCount: args.warningsCount,
      runtimeMs: args.runtimeMs,
      fileKey: args.fileKey,
      fileUrl: args.fileUrl,
      errorSummary: args.errorSummary,
      createdAt
    });
    return { id: String(id), createdAt: toIso(createdAt) };
  }
});

export const listExportHistory = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("exports")
      .withIndex("by_storybookId_createdAt", (q) => q.eq("storybookId", args.storybookId))
      .collect();

    return rows
      .filter((row) => row.ownerId === access.storybook.ownerId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.max(1, Math.min(args.limit ?? 10, 50)))
      .map((row) => ({
        id: String(row._id),
        storybookId: String(row.storybookId),
        exportTarget: row.exportTarget,
        exportHash: row.exportHash,
        status: row.status,
        pageCount: row.pageCount,
        warningsCount: row.warningsCount,
        runtimeMs: row.runtimeMs ?? null,
        fileKey: row.fileKey ?? null,
        fileUrl: row.fileUrl ?? null,
        errorSummary: row.errorSummary ?? null,
        createdAt: toIso(row.createdAt)
      }));
  }
});

export const getExportByHash = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    exportTarget: v.union(v.literal("DIGITAL_PDF"), v.literal("HARDCOPY_PRINT_PDF")),
    exportHash: v.string()
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("exports")
      .withIndex("by_storybookId_exportHash", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    const row = rows
      .filter(
        (item) =>
          item.exportHash === args.exportHash &&
          item.ownerId === access.storybook.ownerId &&
          item.exportTarget === args.exportTarget
      )
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!row) {
      throw new Error("Export record not found");
    }
    return {
      id: String(row._id),
      storybookId: String(row.storybookId),
      exportTarget: row.exportTarget,
      exportHash: row.exportHash,
      status: row.status,
      fileKey: row.fileKey ?? null,
      fileUrl: row.fileUrl ?? null,
      createdAt: toIso(row.createdAt)
    };
  }
});
