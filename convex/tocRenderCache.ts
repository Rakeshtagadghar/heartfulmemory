/**
 * Sprint 34 – ToC render-cache Convex mutations/queries.
 *
 * Tracks whether the generated ToC is stale with respect to the current
 * orientation, reflow settings, and page order.
 */

import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";
import type { TocRenderCache } from "../packages/shared/toc/tocTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDto(doc: {
    _id: string;
    storybookId: string;
    layoutSignature: string;
    paginationVersion: string;
    pageIdToPageNumberMap: unknown;
    lastComputedAt: number;
    updatedAt: number;
}): TocRenderCache & { id: string; storybookId: string } {
    return {
        id: String(doc._id),
        storybookId: String(doc.storybookId),
        layoutSignature: doc.layoutSignature,
        paginationVersion: doc.paginationVersion,
        pageIdToPageNumberMap: (doc.pageIdToPageNumberMap as Record<string, number>) ?? {},
        lastComputedAt: doc.lastComputedAt,
    };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the current render cache for a storybook, or null if it has never
 * been computed. Callers should treat null as stale.
 */
export const getByStorybook = queryGeneric({
    args: {
        viewerSubject: v.optional(v.string()),
        storybookId: v.id("storybooks"),
    },
    handler: async (ctx, args) => {
        await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
        const row = await ctx.db
            .query("tocRenderCache")
            .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
            .unique();
        return row ? toDto(row as Parameters<typeof toDto>[0]) : null;
    },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Marks the ToC cache as stale by resetting layoutSignature to "".
 * Called whenever a layout-affecting event fires (orientation change, page
 * reordering, etc.).
 */
export const markStale = mutationGeneric({
    args: {
        viewerSubject: v.optional(v.string()),
        storybookId: v.id("storybooks"),
    },
    handler: async (ctx, args) => {
        await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
        const now = Date.now();
        const existing = await ctx.db
            .query("tocRenderCache")
            .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { layoutSignature: "", updatedAt: now });
        } else {
            // Create a pre-stale record so there's always a row to patch later
            await ctx.db.insert("tocRenderCache", {
                storybookId: args.storybookId,
                layoutSignature: "",
                paginationVersion: "",
                pageIdToPageNumberMap: {},
                lastComputedAt: 0,
                updatedAt: now,
            });
        }
        return { ok: true as const };
    },
});

/**
 * Writes the results of a completed pagination pass.
 * Called by the pagination engine after it has computed page numbers.
 */
export const updateCache = mutationGeneric({
    args: {
        viewerSubject: v.optional(v.string()),
        storybookId: v.id("storybooks"),
        layoutSignature: v.string(),
        paginationVersion: v.string(),
        pageIdToPageNumberMap: v.any(),
    },
    handler: async (ctx, args) => {
        await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
        const now = Date.now();
        const existing = await ctx.db
            .query("tocRenderCache")
            .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
            .unique();

        const payload = {
            layoutSignature: args.layoutSignature,
            paginationVersion: args.paginationVersion,
            pageIdToPageNumberMap: args.pageIdToPageNumberMap,
            lastComputedAt: now,
            updatedAt: now,
        };

        if (existing) {
            await ctx.db.patch(existing._id, payload);
            return { ok: true as const, id: String(existing._id) };
        }

        const id = await ctx.db.insert("tocRenderCache", {
            storybookId: args.storybookId,
            ...payload,
        });
        return { ok: true as const, id: String(id) };
    },
});
