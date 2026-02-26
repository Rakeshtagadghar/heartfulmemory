import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";
import {
  FREEFORM_DEFAULT_CHAPTER_KEY,
  FREEFORM_DEFAULT_QUESTION_ID
} from "./storybookChapters";
import { getTemplateQuestionsForChapter, loadTemplateV2ByIdFromDbOrSeed } from "./templates";

type ConvexCtx = MutationCtx | QueryCtx;
type ChapterAnswerDoc = Doc<"chapterAnswers">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toAnswerDto(doc: ChapterAnswerDoc) {
  return {
    id: String(doc._id),
    storybookId: String(doc.storybookId),
    chapterInstanceId: String(doc.chapterInstanceId),
    questionId: doc.questionId,
    answerText: doc.answerText ?? null,
    answerJson: doc.answerJson ?? null,
    skipped: doc.skipped,
    source: doc.source,
    version: doc.version,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function hasMeaningfulAnswer(value: {
  answerText?: string | null;
  answerJson?: unknown;
  skipped?: boolean;
}) {
  if (value.skipped) return true;
  if (typeof value.answerText === "string" && value.answerText.trim().length > 0) return true;
  if (value.answerJson !== undefined && value.answerJson !== null) return true;
  return false;
}

async function getStorybookChapterOrThrow(ctx: ConvexCtx, chapterInstanceId: Id<"storybookChapters">) {
  const chapter = await ctx.db.get(chapterInstanceId);
  if (!chapter) throw new Error("Chapter instance not found");
  return chapter;
}

async function getProgressTotalsForChapter(
  ctx: QueryCtx,
  storybook: Doc<"storybooks">,
  chapter: Doc<"storybookChapters">
) {
  if (!storybook.templateId) {
    if (chapter.chapterKey === FREEFORM_DEFAULT_CHAPTER_KEY) {
      return { totalQuestions: 1, requiredQuestions: 1, defaultQuestionId: FREEFORM_DEFAULT_QUESTION_ID };
    }
    return { totalQuestions: 0, requiredQuestions: 0, defaultQuestionId: null as string | null };
  }

  const template = await loadTemplateV2ByIdFromDbOrSeed(ctx, storybook.templateId);
  if (!template) return { totalQuestions: 0, requiredQuestions: 0, defaultQuestionId: null as string | null };
  const questions = getTemplateQuestionsForChapter(template, chapter.chapterKey);
  return {
    totalQuestions: questions.length,
    requiredQuestions: questions.filter((question) => question.required).length,
    defaultQuestionId: questions[0]?.questionId ?? null
  };
}

export const getByChapter = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getStorybookChapterOrThrow(ctx, args.chapterInstanceId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "VIEWER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapterAnswers")
      .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", chapter._id))
      .collect();
    return rows.sort((a, b) => a.updatedAt - b.updatedAt).map(toAnswerDto);
  }
});

export const progressByChapter = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks")
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "VIEWER", args.viewerSubject);
    const chapters = await ctx.db
      .query("storybookChapters")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", args.storybookId))
      .collect();
    const answers = await ctx.db
      .query("chapterAnswers")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();

    const answersByChapterId = new Map<string, ChapterAnswerDoc[]>();
    for (const answer of answers) {
      const key = String(answer.chapterInstanceId);
      const list = answersByChapterId.get(key);
      if (list) list.push(answer);
      else answersByChapterId.set(key, [answer]);
    }

    const progress = [];
    for (const chapter of chapters.sort((a, b) => a.orderIndex - b.orderIndex)) {
      const chapterAnswers = answersByChapterId.get(String(chapter._id)) ?? [];
      let answeredCount = 0;
      let skippedCount = 0;
      const answeredQuestionIds = new Set<string>();
      for (const answer of chapterAnswers) {
        if (!hasMeaningfulAnswer(answer)) continue;
        answeredQuestionIds.add(answer.questionId);
        if (answer.skipped) skippedCount += 1;
      }
      answeredCount = answeredQuestionIds.size;

      const totals = await getProgressTotalsForChapter(ctx, access.storybook, chapter);
      progress.push({
        chapterInstanceId: String(chapter._id),
        chapterKey: chapter.chapterKey,
        answeredCount,
        skippedCount,
        totalQuestions: totals.totalQuestions,
        requiredQuestions: totals.requiredQuestions
      });
    }

    return progress;
  }
});

export const upsert = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    questionId: v.string(),
    answerText: v.optional(v.union(v.string(), v.null())),
    answerJson: v.optional(v.union(v.any(), v.null())),
    skipped: v.optional(v.boolean()),
    source: v.optional(v.union(v.literal("text"), v.literal("voice")))
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const chapter = await getStorybookChapterOrThrow(ctx, args.chapterInstanceId);
    if (String(chapter.storybookId) !== String(args.storybookId)) {
      throw new Error("Chapter does not belong to storybook");
    }

    const existing = await ctx.db
      .query("chapterAnswers")
      .withIndex("by_chapterInstanceId_questionId", (q) =>
        q.eq("chapterInstanceId", args.chapterInstanceId).eq("questionId", args.questionId)
      )
      .unique();

    const now = Date.now();
    const payload = {
      storybookId: args.storybookId,
      chapterInstanceId: args.chapterInstanceId,
      questionId: args.questionId,
      answerText: "answerText" in args ? (args.answerText ?? null) : null,
      answerJson: "answerJson" in args ? (args.answerJson ?? null) : null,
      skipped: args.skipped ?? false,
      source: args.source ?? "text"
    } as const;

    let row: ChapterAnswerDoc | null = null;
    if (existing) {
      await ctx.db.patch(existing._id, {
        answerText: payload.answerText,
        answerJson: payload.answerJson,
        skipped: payload.skipped,
        source: payload.source,
        version: existing.version + 1,
        updatedAt: now
      });
      row = await ctx.db.get(existing._id);
    } else {
      const id = await ctx.db.insert("chapterAnswers", {
        ...payload,
        version: 1,
        createdAt: now,
        updatedAt: now
      });
      row = await ctx.db.get(id);
    }

    if (!row) throw new Error("Failed to save answer");

    const shouldMarkInProgress = hasMeaningfulAnswer(payload) && chapter.status === "not_started";
    if (shouldMarkInProgress) {
      await ctx.db.patch(chapter._id, {
        status: "in_progress",
        updatedAt: now
      });
    }

    await ctx.db.patch(access.storybook._id, { updatedAt: now });

    return {
      ok: true as const,
      answer: toAnswerDto(row),
      chapterStatus: shouldMarkInProgress ? "in_progress" : chapter.status
    };
  }
});

