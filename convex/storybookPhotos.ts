import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireUser } from "./authz";

const MAX_PHOTOS = 20;

export const addPhoto = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    assetId: v.id("assets")
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const storybook = await ctx.db.get(args.storybookId);
    if (!storybook || storybook.ownerId !== viewer.subject) throw new Error("Forbidden");

    const existing = await ctx.db
      .query("storybookPhotos")
      .withIndex("by_storybookId", (q: any) => q.eq("storybookId", args.storybookId))
      .collect();

    if (existing.length >= MAX_PHOTOS) {
      throw new Error(`Cannot add more than ${MAX_PHOTOS} photos per storybook`);
    }

    const orderIndex = existing.length;
    const id = await ctx.db.insert("storybookPhotos", {
      storybookId: args.storybookId,
      ownerUserId: viewer.subject,
      assetId: args.assetId,
      orderIndex,
      createdAt: Date.now()
    });

    // Mark photo status as "done" on storybook
    await ctx.db.patch(args.storybookId, { photoStatus: "done", updatedAt: Date.now() });

    return { ok: true, id: String(id), orderIndex };
  }
});

export const removePhoto = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    photoId: v.id("storybookPhotos")
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const photo = await ctx.db.get(args.photoId);
    if (!photo || photo.ownerUserId !== viewer.subject) throw new Error("Forbidden");
    if (String(photo.storybookId) !== String(args.storybookId)) throw new Error("Forbidden");

    await ctx.db.delete(args.photoId);

    // Re-index remaining photos
    const remaining = await ctx.db
      .query("storybookPhotos")
      .withIndex("by_storybookId_orderIndex", (q: any) => q.eq("storybookId", args.storybookId))
      .collect();
    const sorted = remaining.toSorted((a, b) => a.orderIndex - b.orderIndex);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].orderIndex !== i) {
        await ctx.db.patch(sorted[i]._id, { orderIndex: i });
      }
    }

    // If no photos remain, reset photoStatus
    if (sorted.length === 0) {
      await ctx.db.patch(args.storybookId, { photoStatus: "not_started", updatedAt: Date.now() });
    }

    return { ok: true };
  }
});

export const listPhotos = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const storybook = await ctx.db.get(args.storybookId);
    if (!storybook || storybook.ownerId !== viewer.subject) throw new Error("Forbidden");

    const rows = await ctx.db
      .query("storybookPhotos")
      .withIndex("by_storybookId_orderIndex", (q: any) => q.eq("storybookId", args.storybookId))
      .collect();

    const sorted = rows.toSorted((a, b) => a.orderIndex - b.orderIndex);

    const result = await Promise.all(
      sorted.map(async (row) => {
        const asset = await ctx.db.get(row.assetId);
        return {
          id: String(row._id),
          orderIndex: row.orderIndex,
          assetId: String(row.assetId),
          sourceUrl: asset?.sourceUrl ?? null,
          width: asset?.width ?? null,
          height: asset?.height ?? null,
          mimeType: asset?.mimeType ?? null,
          createdAt: row.createdAt
        };
      })
    );

    return result;
  }
});

export const getCount = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const storybook = await ctx.db.get(args.storybookId);
    if (!storybook || storybook.ownerId !== viewer.subject) throw new Error("Forbidden");

    const rows = await ctx.db
      .query("storybookPhotos")
      .withIndex("by_storybookId", (q: any) => q.eq("storybookId", args.storybookId))
      .collect();

    return { count: rows.length, maxPhotos: MAX_PHOTOS };
  }
});
