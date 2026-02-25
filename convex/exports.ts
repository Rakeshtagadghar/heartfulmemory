import { queryGeneric } from "convex/server";
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
