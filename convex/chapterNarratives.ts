import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the latest narrative for a chapter instance
 */
export const getByChapterInstanceId = query({
    args: { chapterInstanceId: v.id("storybookChapters") },
    handler: async (ctx, args) => {
        // Only fetch the most recent one by version (if we were storing history) or
        // simply there's only one record per chapter instance generally in the new model.
        // For now we assume one active record. If multiple, we sort by version descending.
        const narrative = await ctx.db
            .query("chapterNarratives")
            .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", args.chapterInstanceId))
            .order("desc") // highest version first
            .first();

        return narrative;
    }
});

/**
 * Approve narrative. Mutates the record to mark it as approved
 */
export const approve = mutation({
    args: {
        chapterNarrativeId: v.id("chapterNarratives")
    },
    handler: async (ctx, args) => {
        // Verify auth in real use case
        // const identity = await ctx.auth.getUserIdentity();
        // if (!identity) throw new Error("Unauthorized");

        const narrative = await ctx.db.get(args.chapterNarrativeId);
        if (!narrative) throw new Error("Narrative not found");

        const now = Date.now();
        await ctx.db.patch(args.chapterNarrativeId, {
            approved: true,
            approvedAt: now,
            updatedAt: now
        });

        return { success: true };
    }
});

/**
 * Update text of a specific paragraph manually
 */
export const updateText = mutation({
    args: {
        chapterNarrativeId: v.id("chapterNarratives"),
        paragraphType: v.union(v.literal("opening"), v.literal("story"), v.literal("closing")),
        text: v.string()
    },
    handler: async (ctx, args) => {
        const narrative = await ctx.db.get(args.chapterNarrativeId);
        if (!narrative) throw new Error("Narrative not found");

        const newParagraphs = { ...narrative.paragraphs };
        newParagraphs[args.paragraphType as keyof typeof newParagraphs] = args.text;

        const now = Date.now();
        await ctx.db.patch(args.chapterNarrativeId, {
            paragraphs: newParagraphs,
            // User edited this manually, we should ideally drop the approved status
            approved: false,
            approvedAt: null,
            updatedAt: now
        });

        return { success: true };
    }
});

export const getLatestByHash = internalQuery({
    args: { chapterInstanceId: v.id("storybookChapters"), answersHash: v.string() },
    handler: async (ctx, args) => {
        const narratives = await ctx.db
            .query("chapterNarratives")
            .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", args.chapterInstanceId))
            .order("desc") // highest version first
            .take(10);

        // Find first ready one with matching hash
        return narratives.find(n => n.answersHash === args.answersHash && n.status === "ready") || null;
    }
});

export const internalCreate = internalMutation({
    args: {
        storybookId: v.id("storybooks"),
        chapterInstanceId: v.id("storybookChapters"),
        chapterKey: v.string(),
        version: v.number(),
        status: v.union(v.literal("generating"), v.literal("error")),
        answersHash: v.string(),
        narration: v.any(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("chapterNarratives", {
            ...args,
            approved: false,
            paragraphs: { opening: "", story: "", closing: "" },
            citations: { opening: [], story: [], closing: [] },
            createdAt: now,
            updatedAt: now,
        });
    }
});

export const internalUpdateReady = internalMutation({
    args: {
        chapterNarrativeId: v.id("chapterNarratives"),
        paragraphs: v.any(),
        citations: v.any(),
        warnings: v.array(v.string())
    },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.chapterNarrativeId, {
            status: "ready",
            paragraphs: args.paragraphs,
            citations: args.citations,
            warnings: args.warnings,
            updatedAt: Date.now()
        });
    }
});

export const internalUpdateError = internalMutation({
    args: {
        chapterNarrativeId: v.id("chapterNarratives"),
        warnings: v.array(v.string())
    },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.chapterNarrativeId, {
            status: "error",
            warnings: args.warnings,
            updatedAt: Date.now()
        });
    }
});
