import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireUser, requireOwner } from "./authz";

const assetSourceValidator = v.union(
  v.literal("UPLOAD"),
  v.literal("UNSPLASH"),
  v.literal("PEXELS"),
  v.literal("PIXABAY"),
  v.literal("OPENVERSE"),
  v.literal("RAWPIXEL_PD"),
  v.literal("VECTEEZY")
);

function toIso(value: number) {
  return new Date(value).toISOString();
}

function toAssetDto(doc: {
  _id: unknown;
  ownerId: string;
  source: "UPLOAD" | "UNSPLASH" | "PEXELS" | "PIXABAY" | "OPENVERSE" | "RAWPIXEL_PD" | "VECTEEZY";
  sourceAssetId?: string;
  sourceUrl?: string;
  storageProvider?: string;
  storageBucket?: string;
  storageKey?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  sizeBytes?: number;
  checksum?: string;
  license?: unknown;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: String(doc._id),
    owner_id: doc.ownerId,
    source: doc.source,
    source_asset_id: doc.sourceAssetId ?? null,
    source_url: doc.sourceUrl ?? null,
    storage_provider: doc.storageProvider ?? null,
    storage_bucket: doc.storageBucket ?? null,
    storage_key: doc.storageKey ?? null,
    mime_type: doc.mimeType ?? null,
    width: doc.width ?? null,
    height: doc.height ?? null,
    duration_seconds: doc.durationSeconds ?? null,
    size_bytes: doc.sizeBytes ?? null,
    checksum: doc.checksum ?? null,
    license: doc.license ?? null,
    created_at: toIso(doc.createdAt),
    updated_at: toIso(doc.updatedAt)
  };
}

export const createMetadata = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    source: assetSourceValidator,
    sourceAssetId: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    storageProvider: v.optional(v.string()),
    storageBucket: v.optional(v.string()),
    storageKey: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    sizeBytes: v.optional(v.number()),
    checksum: v.optional(v.string()),
    license: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const now = Date.now();
    const id = await ctx.db.insert("assets", {
      ownerId: viewer.subject,
      source: args.source,
      sourceAssetId: args.sourceAssetId ?? undefined,
      sourceUrl: args.sourceUrl ?? undefined,
      storageProvider: args.storageProvider ?? undefined,
      storageBucket: args.storageBucket ?? undefined,
      storageKey: args.storageKey ?? undefined,
      mimeType: args.mimeType ?? undefined,
      width: args.width ?? undefined,
      height: args.height ?? undefined,
      durationSeconds: args.durationSeconds ?? undefined,
      sizeBytes: args.sizeBytes ?? undefined,
      checksum: args.checksum ?? undefined,
      license: args.license ?? undefined,
      createdAt: now,
      updatedAt: now
    });
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Failed to create asset metadata");
    return toAssetDto(row as never);
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
      .query("assets")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", viewer.subject))
      .collect();
    const limit = args.limit && args.limit > 0 ? Math.min(args.limit, 200) : rows.length;
    return rows
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
      .map((row) => toAssetDto(row as never));
  }
});

export const get = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    assetId: v.id("assets")
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const row = await ctx.db.get(args.assetId);
    if (!row) throw new Error("Asset not found");
    requireOwner({ subject: viewer.subject }, row as never);
    return toAssetDto(row as never);
  }
});

// Backward-compatible aliases.
export const createAssetMetadata = createMetadata;
export const listAssets = listMine;
export const getAsset = get;

