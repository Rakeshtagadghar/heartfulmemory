import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";
import { getTemplateQuestionsForChapter, loadTemplateV2ByIdFromDbOrSeed } from "./templates";

type ConvexCtx = MutationCtx | QueryCtx;
type StorybookChapterDoc = Doc<"storybookChapters">;

const guidedChapterStatusValidator = v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("completed")
);

export const FREEFORM_DEFAULT_CHAPTER_KEY = "ch_freeform_1";
export const FREEFORM_DEFAULT_QUESTION_ID = "q_freeform_story_start";

function toGuidedChapterDto(doc: StorybookChapterDoc) {
  return {
    id: String(doc._id),
    storybookId: String(doc.storybookId),
    chapterKey: doc.chapterKey,
    title: doc.title,
    orderIndex: doc.orderIndex,
    status: doc.status,
    completedAt: doc.completedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

async function getChapterOrThrow(ctx: ConvexCtx, chapterInstanceId: Id<"storybookChapters">) {
  const chapter = await ctx.db.get(chapterInstanceId);
  if (!chapter) throw new Error("Chapter instance not found");
  return chapter;
}

async function touchStorybook(ctx: ConvexCtx, storybookId: Id<"storybooks">, at = Date.now()) {
  await ctx.db.patch(storybookId, { updatedAt: at });
}

function hasSavedAnswer(value: {
  answerText?: string | null;
  answerJson?: unknown;
  skipped?: boolean;
}) {
  if (value.skipped) return true;
  if (typeof value.answerText === "string" && value.answerText.trim().length > 0) return true;
  if (value.answerJson !== undefined && value.answerJson !== null) return true;
  return false;
}

export async function instantiateGuidedChaptersFromTemplate(
  ctx: MutationCtx,
  args: {
    storybookId: Id<"storybooks">;
    template: { chapters: Array<{ chapterKey: string; title: string }> };
  }
) {
  const now = Date.now();
  const created: ReturnType<typeof toGuidedChapterDto>[] = [];

  for (const [index, chapter] of args.template.chapters.entries()) {
    const id = await ctx.db.insert("storybookChapters", {
      storybookId: args.storybookId,
      chapterKey: chapter.chapterKey,
      title: chapter.title,
      orderIndex: index,
      status: "not_started",
      completedAt: null,
      createdAt: now,
      updatedAt: now
    });
    const row = await ctx.db.get(id);
    if (row) created.push(toGuidedChapterDto(row));
  }

  await touchStorybook(ctx, args.storybookId, now);
  return created;
}

export async function createDefaultGuidedChapter(ctx: MutationCtx, storybookId: Id<"storybooks">) {
  const now = Date.now();
  const id = await ctx.db.insert("storybookChapters", {
    storybookId,
    chapterKey: FREEFORM_DEFAULT_CHAPTER_KEY,
    title: "Chapter 1",
    orderIndex: 0,
    status: "not_started",
    completedAt: null,
    createdAt: now,
    updatedAt: now
  });
  const row = await ctx.db.get(id);
  if (!row) throw new Error("Failed to create default chapter");
  await touchStorybook(ctx, storybookId, now);
  return toGuidedChapterDto(row);
}

export const listByStorybook = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "VIEWER", args.viewerSubject);
    const rows = await ctx.db
      .query("storybookChapters")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();

    return rows.sort((a, b) => a.orderIndex - b.orderIndex).map(toGuidedChapterDto);
  }
});

export const get = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "VIEWER", args.viewerSubject);
    return toGuidedChapterDto(chapter);
  }
});

export const markInProgress = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);

    if (chapter.status === "completed") {
      return { ok: true, chapter: toGuidedChapterDto(chapter) };
    }

    const now = Date.now();
    const nextStatus = chapter.status === "in_progress" ? chapter.status : "in_progress";
    if (nextStatus !== chapter.status) {
      await ctx.db.patch(chapter._id, { status: "in_progress", updatedAt: now });
      await touchStorybook(ctx, chapter.storybookId, now);
    }
    const updated = await ctx.db.get(chapter._id);
    return { ok: true, chapter: updated ? toGuidedChapterDto(updated) : toGuidedChapterDto(chapter) };
  }
});

export const complete = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    const access = await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);

    let requiredQuestionIds: string[] = [];
    let allQuestionIds: string[] = [];
    if (access.storybook.templateId) {
      const template = await loadTemplateV2ByIdFromDbOrSeed(ctx, access.storybook.templateId);
      if (template) {
        const questions = getTemplateQuestionsForChapter(template, chapter.chapterKey);
        allQuestionIds = questions.map((question) => question.questionId);
        requiredQuestionIds = questions.filter((question) => question.required).map((question) => question.questionId);
      }
    } else if (chapter.chapterKey === FREEFORM_DEFAULT_CHAPTER_KEY) {
      allQuestionIds = [FREEFORM_DEFAULT_QUESTION_ID];
      requiredQuestionIds = [FREEFORM_DEFAULT_QUESTION_ID];
    }

    const answers = await ctx.db
      .query("chapterAnswers")
      .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", chapter._id))
      .collect();

    const answeredQuestionIds = new Set<string>();
    for (const answer of answers) {
      if (hasSavedAnswer(answer)) {
        answeredQuestionIds.add(answer.questionId);
      }
    }

    const completionQuestionIds = allQuestionIds.length > 0 ? allQuestionIds : requiredQuestionIds;
    const missingQuestionIds = completionQuestionIds.filter((questionId) => !answeredQuestionIds.has(questionId));
    if (missingQuestionIds.length > 0) {
      return {
        ok: false as const,
        errorCode: "MISSING_REQUIRED_ANSWERS" as const,
        missingQuestionIds
      };
    }

    const now = Date.now();
    await ctx.db.patch(chapter._id, {
      status: "completed",
      completedAt: now,
      updatedAt: now
    });
    await touchStorybook(ctx, chapter.storybookId, now);
    const updated = await ctx.db.get(chapter._id);
    if (!updated) throw new Error("Chapter instance not found");
    return { ok: true as const, chapter: toGuidedChapterDto(updated) };
  }
});

export const update = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters"),
    patch: v.object({
      title: v.optional(v.string()),
      status: v.optional(guidedChapterStatusValidator)
    })
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    const patch: Partial<StorybookChapterDoc> & { updatedAt: number } = { updatedAt: now };
    if (typeof args.patch.title === "string" && args.patch.title.trim()) patch.title = args.patch.title.trim();
    if (args.patch.status) patch.status = args.patch.status;
    await ctx.db.patch(chapter._id, patch as never);
    await touchStorybook(ctx, chapter.storybookId, now);
    const updated = await ctx.db.get(chapter._id);
    if (!updated) throw new Error("Chapter instance not found");
    return toGuidedChapterDto(updated);
  }
});
