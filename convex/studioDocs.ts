import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";

export const getByStorybook = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "VIEWER", args.viewerSubject);
    const [pages, frames] = await Promise.all([
      ctx.db
        .query("pages")
        .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
        .collect(),
      ctx.db
        .query("frames")
        .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
        .collect()
    ]);

    return {
      storybookId: String(args.storybookId),
      pages: pages
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((page) => ({
          id: String(page._id),
          orderIndex: page.orderIndex,
          title: page.title ?? "",
          isHidden: page.isHidden ?? false,
          isLocked: page.isLocked ?? false,
          widthPx: page.widthPx,
          heightPx: page.heightPx,
          updatedAt: page.updatedAt
        })),
      frames: frames.map((frame) => ({
        id: String(frame._id),
        pageId: String(frame.pageId),
        type: frame.type,
        zIndex: frame.zIndex,
        content: frame.content ?? {},
        updatedAt: frame.updatedAt,
        version: frame.version ?? 1
      }))
    };
  }
});

export const save = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    const currentSettings =
      access.storybook.settings && typeof access.storybook.settings === "object" && !Array.isArray(access.storybook.settings)
        ? (access.storybook.settings as Record<string, unknown>)
        : {};
    await ctx.db.patch(access.storybook._id as never, {
      updatedAt: now,
      settings: {
        ...currentSettings,
        studioDocMeta: {
          ...(currentSettings.studioDocMeta &&
          typeof currentSettings.studioDocMeta === "object" &&
          !Array.isArray(currentSettings.studioDocMeta)
            ? (currentSettings.studioDocMeta as Record<string, unknown>)
            : {}),
          touchedAt: now,
          note: args.note ?? null
        }
      }
    });
    return { ok: true as const, storybookId: String(args.storybookId), updatedAt: now };
  }
});
