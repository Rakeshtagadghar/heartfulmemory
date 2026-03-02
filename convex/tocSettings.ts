/**
 * Sprint 34 – ToC settings Convex mutations/queries.
 *
 * One TocSettings document per storybook. Created on first access.
 */

import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";
import type { TocSettings } from "../packages/shared/toc/tocTypes";
import { DEFAULT_TOC_SETTINGS } from "../packages/shared/toc/tocTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDto(doc: {
    _id: string;
    storybookId: string;
    title: string;
    includeMode: string;
    includePageNumbers: boolean;
    template: string;
    dotLeaders: boolean;
    indentPerLevelPx: number;
    manualOrder: boolean;
    allowMultiPage: boolean;
    wrapMode: string;
    maxLinesPerEntry: number;
    updatedAt: number;
}): TocSettings & { id: string; storybookId: string; updatedAt: number } {
    return {
        id: String(doc._id),
        storybookId: String(doc.storybookId),
        title: doc.title,
        includeMode: doc.includeMode as TocSettings["includeMode"],
        includePageNumbers: doc.includePageNumbers,
        template: doc.template as TocSettings["template"],
        dotLeaders: doc.dotLeaders,
        indentPerLevelPx: doc.indentPerLevelPx,
        manualOrder: doc.manualOrder,
        allowMultiPage: doc.allowMultiPage,
        wrapMode: doc.wrapMode as TocSettings["wrapMode"],
        maxLinesPerEntry: doc.maxLinesPerEntry,
        updatedAt: doc.updatedAt,
    };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the TocSettings for a storybook, or the default values if none have
 * been saved yet. Always resolves to a usable TocSettings object.
 */
export const getByStorybook = queryGeneric({
    args: {
        viewerSubject: v.optional(v.string()),
        storybookId: v.id("storybooks"),
    },
    handler: async (ctx, args) => {
        await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
        const row = await ctx.db
            .query("tocSettings")
            .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
            .unique();
        if (!row) {
            return {
                id: null,
                storybookId: String(args.storybookId),
                ...DEFAULT_TOC_SETTINGS,
                updatedAt: 0,
            };
        }
        return toDto(row as Parameters<typeof toDto>[0]);
    },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const settingsValidator = v.object({
    title: v.string(),
    includeMode: v.union(
        v.literal("chapters_only"),
        v.literal("chapters_and_pages"),
        v.literal("custom")
    ),
    includePageNumbers: v.boolean(),
    template: v.union(
        v.literal("minimal"),
        v.literal("classic_dots"),
        v.literal("royal")
    ),
    dotLeaders: v.boolean(),
    indentPerLevelPx: v.number(),
    manualOrder: v.boolean(),
    allowMultiPage: v.boolean(),
    wrapMode: v.union(
        v.literal("wrap"),
        v.literal("truncate"),
        v.literal("wrap_then_truncate")
    ),
    maxLinesPerEntry: v.number(),
});

/**
 * Creates or fully replaces the TocSettings for a storybook.
 */
export const upsert = mutationGeneric({
    args: {
        viewerSubject: v.optional(v.string()),
        storybookId: v.id("storybooks"),
        settings: settingsValidator,
    },
    handler: async (ctx, args) => {
        await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
        const now = Date.now();
        const existing = await ctx.db
            .query("tocSettings")
            .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { ...args.settings, updatedAt: now });
            return { ok: true as const, id: String(existing._id) };
        }

        const id = await ctx.db.insert("tocSettings", {
            storybookId: args.storybookId,
            ...args.settings,
            updatedAt: now,
        });
        return { ok: true as const, id: String(id) };
    },
});
