import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook, requireUser } from "./authz";

const bookModeValidator = v.union(v.literal("DIGITAL"), v.literal("PRINT"));
const bookStatusValidator = v.union(
  v.literal("DRAFT"),
  v.literal("ACTIVE"),
  v.literal("ARCHIVED"),
  v.literal("DELETED")
);

function toIso(value: number) {
  return new Date(value).toISOString();
}

function normalizeTitle(title?: string | null) {
  const trimmed = title?.trim();
  return trimmed && trimmed.length > 0 ? trimmed.slice(0, 200) : "Untitled Storybook";
}

function toStorybookDto(doc: {
  _id: unknown;
  ownerId: string;
  title: string;
  subtitle?: string;
  bookMode: "DIGITAL" | "PRINT";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";
  coverAssetId?: unknown;
  settings?: unknown;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: String(doc._id),
    owner_id: doc.ownerId,
    title: doc.title,
    subtitle: doc.subtitle ?? null,
    book_mode: doc.bookMode,
    status: doc.status,
    cover_asset_id: doc.coverAssetId ? String(doc.coverAssetId) : null,
    settings:
      doc.settings && typeof doc.settings === "object" && !Array.isArray(doc.settings)
        ? (doc.settings as Record<string, unknown>)
        : {},
    created_at: toIso(doc.createdAt),
    updated_at: toIso(doc.updatedAt)
  };
}

export const create = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    title: v.optional(v.string()),
    bookMode: v.optional(bookModeValidator),
    templateId: v.optional(v.string()),
    templateVersion: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const now = Date.now();
    const id = await ctx.db.insert("storybooks", {
      ownerId: viewer.subject,
      title: normalizeTitle(args.title),
      bookMode: args.bookMode ?? "DIGITAL",
      status: "DRAFT",
      settings:
        args.templateId || args.templateVersion
          ? {
              templateId: args.templateId ?? null,
              templateVersion: args.templateVersion ?? null
            }
          : {},
      createdAt: now,
      updatedAt: now
    });
    const created = await ctx.db.get(id);
    if (!created) throw new Error("Failed to create storybook");
    return toStorybookDto(created as never);
  }
});

export const listMine = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const rows = await ctx.db
      .query("storybooks")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", viewer.subject))
      .collect();

    return rows
      .filter((row) => row.status !== "DELETED")
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((row) => toStorybookDto(row as never));
  }
});

export const get = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "VIEWER", args.viewerSubject);
    return toStorybookDto(access.storybook as never);
  }
});

export const update = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    patch: v.object({
      title: v.optional(v.string()),
      subtitle: v.optional(v.union(v.string(), v.null())),
      book_mode: v.optional(bookModeValidator),
      status: v.optional(bookStatusValidator),
      settings: v.optional(v.any()),
      cover_asset_id: v.optional(v.union(v.id("assets"), v.string(), v.null()))
    })
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    const patch: Record<string, unknown> = {
      updatedAt: now
    };

    if (typeof args.patch.title === "string") patch.title = normalizeTitle(args.patch.title);
    if ("subtitle" in args.patch) patch.subtitle = args.patch.subtitle ?? undefined;
    if (args.patch.book_mode) patch.bookMode = args.patch.book_mode;
    if (args.patch.status) patch.status = args.patch.status;
    if ("settings" in args.patch) patch.settings = args.patch.settings ?? {};
    if ("cover_asset_id" in args.patch) {
      const value = args.patch.cover_asset_id;
      patch.coverAssetId = typeof value === "string" && !value ? undefined : (value as unknown);
    }

    await ctx.db.patch(access.storybook._id as never, patch as never);
    const updated = await ctx.db.get(access.storybook._id as never);
    if (!updated) throw new Error("Not found");
    return toStorybookDto(updated as never);
  }
});

export const archive = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    await ctx.db.patch(access.storybook._id as never, {
      status: "ARCHIVED",
      updatedAt: Date.now()
    });
    return { ok: true };
  }
});

export const remove = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);

    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    const blocks = await ctx.db
      .query("chapterBlocks")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    const collaborators = await ctx.db
      .query("collaborators")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();

    for (const row of blocks) {
      await ctx.db.delete(row._id);
    }
    for (const row of chapters) {
      await ctx.db.delete(row._id);
    }
    for (const row of collaborators) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.delete(access.storybook._id as never);

    return { ok: true };
  }
});

// Backward-compatible aliases used by existing wrappers/tests during the migration.
export const createStorybook = create;
export const listStorybooks = listMine;
export const getStorybook = get;
export const updateStorybook = update;

