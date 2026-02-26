import type { Doc } from "./_generated/dataModel";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireUser } from "./authz";

type MediaAssetDoc = Doc<"mediaAssets">;

const sourceValidator = v.union(v.literal("upload"), v.literal("unsplash"), v.literal("pexels"), v.literal("system"));
const attributionValidator = v.object({
  authorName: v.string(),
  authorUrl: v.optional(v.union(v.string(), v.null())),
  assetUrl: v.optional(v.union(v.string(), v.null())),
  licenseUrl: v.optional(v.union(v.string(), v.null())),
  provider: sourceValidator,
  attributionText: v.string()
});

function toMediaAssetDto(doc: MediaAssetDoc) {
  return {
    id: String(doc._id),
    ownerUserId: doc.ownerUserId ?? null,
    type: doc.type,
    source: doc.source,
    sourceId: doc.sourceId ?? null,
    cachedUrl: doc.cachedUrl,
    thumbUrl: doc.thumbUrl ?? null,
    width: doc.width,
    height: doc.height,
    mime: doc.mime ?? null,
    attribution: doc.attribution,
    createdAt: doc.createdAt
  };
}

export const createOrGetBySource = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    ownerUserId: v.optional(v.union(v.string(), v.null())),
    source: sourceValidator,
    sourceId: v.optional(v.union(v.string(), v.null())),
    cachedUrl: v.string(),
    thumbUrl: v.optional(v.union(v.string(), v.null())),
    width: v.number(),
    height: v.number(),
    mime: v.optional(v.union(v.string(), v.null())),
    attribution: attributionValidator
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.viewerSubject);
    if (args.sourceId) {
      const existing = await ctx.db
        .query("mediaAssets")
        .withIndex("by_source_sourceId", (q) => q.eq("source", args.source).eq("sourceId", args.sourceId))
        .unique();
      if (existing) {
        return {
          ok: true as const,
          mediaAssetId: existing._id,
          mediaAsset: toMediaAssetDto(existing),
          reused: true as const
        };
      }
    }

    const id = await ctx.db.insert("mediaAssets", {
      ownerUserId: "ownerUserId" in args ? (args.ownerUserId ?? null) : null,
      type: "image",
      source: args.source,
      sourceId: args.sourceId ?? null,
      cachedUrl: args.cachedUrl,
      thumbUrl: args.thumbUrl ?? null,
      width: args.width,
      height: args.height,
      mime: args.mime ?? null,
      attribution: args.attribution,
      createdAt: Date.now()
    });
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Failed to create media asset");
    return { ok: true as const, mediaAssetId: row._id, mediaAsset: toMediaAssetDto(row), reused: false as const };
  }
});

export const getById = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    mediaAssetId: v.id("mediaAssets")
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const row = await ctx.db.get(args.mediaAssetId);
    if (!row) throw new Error("Media asset not found");
    if (row.ownerUserId && row.ownerUserId !== viewer.subject) {
      throw new Error("Forbidden");
    }
    return toMediaAssetDto(row);
  }
});

export const getBySource = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    source: sourceValidator,
    sourceId: v.string()
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.viewerSubject);
    const row = await ctx.db
      .query("mediaAssets")
      .withIndex("by_source_sourceId", (q) => q.eq("source", args.source).eq("sourceId", args.sourceId))
      .unique();
    return row ? toMediaAssetDto(row) : null;
  }
});

export const listMine = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const rows = await ctx.db
      .query("mediaAssets")
      .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", viewer.subject))
      .collect();

    const limit = args.limit && args.limit > 0 ? Math.min(200, args.limit) : rows.length;
    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map(toMediaAssetDto);
  }
});

// Internal-ish helper mutation for system cache population. Kept public for current app wrappers.
export const createSystemCached = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    source: sourceValidator,
    sourceId: v.optional(v.union(v.string(), v.null())),
    cachedUrl: v.string(),
    thumbUrl: v.optional(v.union(v.string(), v.null())),
    width: v.number(),
    height: v.number(),
    mime: v.optional(v.union(v.string(), v.null())),
    attribution: attributionValidator
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.viewerSubject);
    if (args.sourceId) {
      const existing = await ctx.db
        .query("mediaAssets")
        .withIndex("by_source_sourceId", (q) => q.eq("source", args.source).eq("sourceId", args.sourceId))
        .unique();
      if (existing) {
        return {
          ok: true as const,
          mediaAssetId: existing._id,
          mediaAsset: toMediaAssetDto(existing),
          reused: true as const
        };
      }
    }

    const id = await ctx.db.insert("mediaAssets", {
      ownerUserId: null,
      type: "image",
      source: args.source,
      sourceId: args.sourceId ?? null,
      cachedUrl: args.cachedUrl,
      thumbUrl: args.thumbUrl ?? null,
      width: args.width,
      height: args.height,
      mime: args.mime ?? null,
      attribution: args.attribution,
      createdAt: Date.now()
    });
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Failed to create media asset");
    return { ok: true as const, mediaAssetId: row._id, mediaAsset: toMediaAssetDto(row), reused: false as const };
  }
});
