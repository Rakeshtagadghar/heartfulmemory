import type { MutationCtx } from "./_generated/server";
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

function getMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function getOrCreateMonthlyUsageRow(ctx: MutationCtx, monthKey: string) {
  const existing = await ctx.db
    .query("r2UsageMonthly")
    .withIndex("by_monthKey", (q) => q.eq("monthKey", monthKey))
    .unique();
  if (existing) return existing;

  const now = Date.now();
  const id = await ctx.db.insert("r2UsageMonthly", {
    monthKey,
    reservedStorageBytes: 0,
    classAOps: 0,
    classBOps: 0,
    createdAt: now,
    updatedAt: now
  });
  const row = await ctx.db.get(id);
  if (!row) throw new Error("Could not initialize R2 monthly usage row");
  return row;
}

async function insertAssetMetadata(
  ctx: MutationCtx,
  input: {
    viewerSubject?: string;
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
  }
) {
  const viewer = await requireUser(ctx, input.viewerSubject);
  const now = Date.now();
  const id = await ctx.db.insert("assets", {
    ownerId: viewer.subject,
    source: input.source,
    sourceAssetId: input.sourceAssetId ?? undefined,
    sourceUrl: input.sourceUrl ?? undefined,
    storageProvider: input.storageProvider ?? undefined,
    storageBucket: input.storageBucket ?? undefined,
    storageKey: input.storageKey ?? undefined,
    mimeType: input.mimeType ?? undefined,
    width: input.width ?? undefined,
    height: input.height ?? undefined,
    durationSeconds: input.durationSeconds ?? undefined,
    sizeBytes: input.sizeBytes ?? undefined,
    checksum: input.checksum ?? undefined,
    license: input.license ?? undefined,
    createdAt: now,
    updatedAt: now
  });
  const row = await ctx.db.get(id);
  if (!row) throw new Error("Failed to create asset metadata");
  return toAssetDto(row as never);
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
    return insertAssetMetadata(ctx, args);
  }
});

export const createFromUpload = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storageProvider: v.string(),
    storageBucket: v.optional(v.string()),
    storageKey: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    sizeBytes: v.optional(v.number()),
    checksum: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return insertAssetMetadata(ctx, {
      viewerSubject: args.viewerSubject,
      source: "UPLOAD",
      storageProvider: args.storageProvider,
      storageBucket: args.storageBucket,
      storageKey: args.storageKey,
      sourceUrl: args.sourceUrl,
      mimeType: args.mimeType,
      width: args.width,
      height: args.height,
      sizeBytes: args.sizeBytes,
      checksum: args.checksum
    });
  }
});

export const createFromStock = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    source: v.union(v.literal("UNSPLASH"), v.literal("PEXELS")),
    sourceAssetId: v.string(),
    sourceUrl: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    license: v.any()
  },
  handler: async (ctx, args) => {
    return insertAssetMetadata(ctx, {
      viewerSubject: args.viewerSubject,
      source: args.source,
      sourceAssetId: args.sourceAssetId,
      sourceUrl: args.sourceUrl,
      mimeType: args.mimeType,
      width: args.width,
      height: args.height,
      license: args.license
    });
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

export const getSignedViewUrl = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    assetId: v.id("assets"),
    purpose: v.union(v.literal("preview"), v.literal("export")),
    target: v.optional(v.union(v.literal("DIGITAL_PDF"), v.literal("HARDCOPY_PRINT_PDF")))
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const row = await ctx.db.get(args.assetId);
    if (!row) throw new Error("Asset not found");
    requireOwner({ subject: viewer.subject }, row as never);
    return {
      assetId: String(row._id),
      url: row.sourceUrl ?? null,
      storageKey: row.storageKey ?? null,
      storageProvider: row.storageProvider ?? null,
      purpose: args.purpose,
      target: args.target ?? null
    };
  }
});

export const getR2MonthlyUsage = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    monthKey: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.viewerSubject);
    const monthKey = args.monthKey ?? getMonthKey();
    const row = await ctx.db
      .query("r2UsageMonthly")
      .withIndex("by_monthKey", (q) => q.eq("monthKey", monthKey))
      .unique();
    return {
      monthKey,
      reservedStorageBytes: row?.reservedStorageBytes ?? 0,
      classAOps: row?.classAOps ?? 0,
      classBOps: row?.classBOps ?? 0
    };
  }
});

export const reserveR2UploadQuota = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    sizeBytes: v.number(),
    caps: v.object({
      monthlyStorageBytesCap: v.number(),
      monthlyClassAOpsCap: v.number(),
      monthlyClassBOpsCap: v.number()
    }),
    monthKey: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.viewerSubject);
    const monthKey = args.monthKey ?? getMonthKey();
    const row = await getOrCreateMonthlyUsageRow(ctx, monthKey);
    const nextStorage = row.reservedStorageBytes + Math.max(0, Math.floor(args.sizeBytes));
    const nextClassA = row.classAOps + 1;

    if (nextStorage > args.caps.monthlyStorageBytesCap) {
      throw new Error("R2_FREE_TIER_LIMIT_STORAGE_MONTHLY");
    }
    if (nextClassA > args.caps.monthlyClassAOpsCap) {
      throw new Error("R2_FREE_TIER_LIMIT_CLASS_A_MONTHLY");
    }

    const now = Date.now();
    await ctx.db.patch(row._id, {
      reservedStorageBytes: nextStorage,
      classAOps: nextClassA,
      updatedAt: now
    });

    return {
      monthKey,
      reservedStorageBytes: nextStorage,
      classAOps: nextClassA,
      classBOps: row.classBOps,
      caps: args.caps
    };
  }
});

export const reserveR2ClassBQuota = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    readOps: v.optional(v.number()),
    caps: v.object({
      monthlyStorageBytesCap: v.number(),
      monthlyClassAOpsCap: v.number(),
      monthlyClassBOpsCap: v.number()
    }),
    monthKey: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.viewerSubject);
    const monthKey = args.monthKey ?? getMonthKey();
    const row = await getOrCreateMonthlyUsageRow(ctx, monthKey);
    const increment = Math.max(1, Math.floor(args.readOps ?? 1));
    const nextClassB = row.classBOps + increment;
    if (nextClassB > args.caps.monthlyClassBOpsCap) {
      throw new Error("R2_FREE_TIER_LIMIT_CLASS_B_MONTHLY");
    }
    const now = Date.now();
    await ctx.db.patch(row._id, {
      classBOps: nextClassB,
      updatedAt: now
    });
    return {
      monthKey,
      reservedStorageBytes: row.reservedStorageBytes,
      classAOps: row.classAOps,
      classBOps: nextClassB,
      caps: args.caps
    };
  }
});

// Backward-compatible aliases.
export const createAssetMetadata = createMetadata;
export const createAssetFromUpload = createFromUpload;
export const createAssetFromStock = createFromStock;
export const listAssets = listMine;
export const getAsset = get;
export const getR2Usage = getR2MonthlyUsage;
