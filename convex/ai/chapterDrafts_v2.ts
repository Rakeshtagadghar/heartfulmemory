"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { api } from "../_generated/api";
import { getConvexAiEnv } from "../env";
import { checkAndRecordAiRateLimit } from "./rateLimit";
import { createLlmRegistry } from "../../lib/ai/llmRegistry";
import { buildChapterDraftPromptV2 } from "../../lib/ai/prompts/chapterDraftPrompt_v2";
import { getSectionFrameworkForChapterKeyV2 } from "../../lib/ai/prompts/sectionGuidance_v2";
import { validateDraftOutputV1 } from "../../lib/ai/validators/draftValidator";
import { runDraftQualityChecks } from "../../lib/ai/qualityChecks";
import type {
  ChapterDraftSection,
  ChapterDraftSectionDefinition,
  DraftNarrationSettings
} from "../../packages/shared/drafts/draftTypes";

type StableAiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CHAPTER_NOT_COMPLETED"
  | "NO_ANSWERS"
  | "RATE_LIMIT"
  | "DRAFT_ALREADY_GENERATING"
  | "INVALID_SECTION"
  | "GENERATION_EMPTY"
  | "PROMPT_LEAK"
  | "REPEATED_SECTION_TEXT"
  | "PROVIDER_ERROR"
  | "UNKNOWN";

async function requireActionUser(ctx: ActionCtx, explicitSubject?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const subject = identity?.subject || identity?.tokenIdentifier || explicitSubject || null;
  if (!subject) throw new Error("Unauthorized");
  return { subject };
}

function mapAiActionError(error: unknown): { code: StableAiErrorCode; message: string; retryable: boolean } {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown generation error");
  const lower = message.toLowerCase();
  if (lower.includes("unauthorized")) return { code: "UNAUTHORIZED", message, retryable: false };
  if (lower.includes("forbidden")) return { code: "FORBIDDEN", message, retryable: false };
  if (lower.includes("already generating")) return { code: "DRAFT_ALREADY_GENERATING", message, retryable: true };
  if (lower.includes("section")) return { code: "INVALID_SECTION", message, retryable: false };
  return { code: "PROVIDER_ERROR", message, retryable: true };
}

function freeformQuestionPrompt(chapterTitle: string) {
  return `Tell the story you want to capture in "${chapterTitle}".`;
}

function normalizeNarration(value: Record<string, unknown> | null | undefined): DraftNarrationSettings {
  return {
    voice: value?.voice === "first_person" ? "first_person" : "third_person",
    tense: value?.tense === "present" ? "present" : "past",
    tone:
      value?.tone === "formal" || value?.tone === "playful" || value?.tone === "poetic"
        ? value.tone
        : "warm",
    length: value?.length === "short" || value?.length === "long" ? value.length : "medium"
  };
}

function buildAnswerPromptMap(input: {
  templateId: string | null;
  chapterKey: string;
  chapterTitle: string;
  template: Record<string, unknown> | null;
}) {
  const map = new Map<string, string>();
  if (
    input.template &&
    typeof input.template.questionFlow === "object" &&
    input.template.questionFlow &&
    !Array.isArray(input.template.questionFlow)
  ) {
    const flow = input.template.questionFlow as Record<string, unknown>;
    const chapterQuestions = Array.isArray(flow[input.chapterKey]) ? (flow[input.chapterKey] as unknown[]) : [];
    for (const item of chapterQuestions) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const row = item as Record<string, unknown>;
      if (typeof row.questionId === "string" && typeof row.prompt === "string") {
        map.set(row.questionId, row.prompt);
      }
    }
  }
  if (!input.templateId) {
    map.set("q_freeform_story_start", freeformQuestionPrompt(input.chapterTitle));
  }
  return map;
}

function hasMeaningfulAnswer(answer: { answerText?: string | null; skipped?: boolean }) {
  if (answer.skipped) return false;
  return typeof answer.answerText === "string" && answer.answerText.trim().length > 0;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeGeneratedSectionsForFramework(
  targetSections: ChapterDraftSectionDefinition[],
  generatedSections: ChapterDraftSection[]
) {
  const byId = new Map(generatedSections.map((section) => [section.sectionId, section] as const));
  return targetSections.map((targetSection) => {
    const generated = byId.get(targetSection.sectionId);
    const text = typeof generated?.text === "string" ? generated.text.trim() : "";
    return {
      sectionId: targetSection.sectionId,
      title: targetSection.title,
      guidance: targetSection.guidance,
      text,
      wordCount: countWords(text),
      citations: Array.isArray(generated?.citations) ? [...generated.citations] : [],
      uncertain: generated?.uncertain
    } satisfies ChapterDraftSection;
  });
}

function mergeRegeneratedSectionText(
  latestSections: ChapterDraftSection[],
  targetSection: ChapterDraftSectionDefinition,
  regeneratedSection: ChapterDraftSection | undefined
) {
  const regeneratedText = (regeneratedSection?.text ?? "").trim();
  const regeneratedCitations = Array.isArray(regeneratedSection?.citations) ? [...regeneratedSection.citations] : [];

  let found = false;
  const merged = latestSections.map((section) => {
    if (section.sectionId !== targetSection.sectionId) return section;
    found = true;
    return {
      ...section,
      title: targetSection.title,
      guidance: targetSection.guidance,
      text: regeneratedText,
      wordCount: countWords(regeneratedText),
      citations: regeneratedCitations,
      uncertain: regeneratedSection?.uncertain
    };
  });

  if (found) return merged;
  return [
    ...merged,
    {
      sectionId: targetSection.sectionId,
      title: targetSection.title,
      guidance: targetSection.guidance,
      text: regeneratedText,
      wordCount: countWords(regeneratedText),
      citations: regeneratedCitations,
      uncertain: regeneratedSection?.uncertain
    }
  ];
}

function combineWarnings(
  qualityWarnings: Array<{ code: string; message: string; severity: "info" | "warning" | "error"; sectionId?: string }>,
  validatorWarnings: Array<{ code: string; message: string; severity: "info" | "warning" | "error"; sectionId?: string }>
) {
  return [...qualityWarnings, ...validatorWarnings];
}

export const generateV2 = action({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    try {
      const viewer = await requireActionUser(ctx, args.viewerSubject);
      const aiEnv = getConvexAiEnv();
      const rate = checkAndRecordAiRateLimit(viewer.subject, aiEnv.rateLimitPerUserPerMinute);
      if (!rate.allowed) {
        return {
          ok: false as const,
          errorCode: "RATE_LIMIT" as const,
          message: "Draft generation rate limit reached. Please try again shortly.",
          retryable: true
        };
      }

      const [storybook, chapter, answers, latestDraft] = await Promise.all([
        ctx.runQuery(api.storybooks.getGuidedById, {
          viewerSubject: viewer.subject,
          storybookId: args.storybookId
        }),
        ctx.runQuery(api.storybookChapters.get, {
          viewerSubject: viewer.subject,
          chapterInstanceId: args.chapterInstanceId
        }),
        ctx.runQuery(api.chapterAnswers.getByChapter, {
          viewerSubject: viewer.subject,
          chapterInstanceId: args.chapterInstanceId
        }),
        ctx.runQuery(api.chapterDrafts.getLatestByChapter, {
          viewerSubject: viewer.subject,
          chapterInstanceId: args.chapterInstanceId
        })
      ]);

      if (chapter.status !== "completed") {
        return {
          ok: false as const,
          errorCode: "CHAPTER_NOT_COMPLETED" as const,
          message: "Complete the chapter before generating a draft.",
          retryable: false
        };
      }

      const templateResult = storybook.templateId
        ? await ctx.runQuery(api.templates.getById, { templateId: storybook.templateId })
        : null;
      const promptMap = buildAnswerPromptMap({
        templateId: storybook.templateId,
        chapterKey: chapter.chapterKey,
        chapterTitle: chapter.title,
        template: (templateResult as Record<string, unknown> | null) ?? null
      });

      const groundedAnswers = answers
        .filter((answer) => hasMeaningfulAnswer(answer))
        .map((answer) => ({
          questionId: answer.questionId,
          prompt: promptMap.get(answer.questionId) ?? `Question ${answer.questionId}`,
          answerText: (answer.answerText ?? "").trim()
        }))
        .filter((answer) => answer.answerText.length > 0);

      if (groundedAnswers.length === 0) {
        return {
          ok: false as const,
          errorCode: "NO_ANSWERS" as const,
          message: "No saved answers found for this chapter.",
          retryable: false
        };
      }

      const sectionPlan = getSectionFrameworkForChapterKeyV2(chapter.chapterKey);
      const narration = normalizeNarration((storybook.narration ?? null) as Record<string, unknown> | null);
      const begin = await ctx.runMutation(api.chapterDrafts.beginVersion, {
        viewerSubject: viewer.subject,
        storybookId: args.storybookId,
        chapterInstanceId: args.chapterInstanceId,
        chapterKey: chapter.chapterKey,
        narration,
        sourceAnswerIds: groundedAnswers.map((answer) => answer.questionId),
        seedFromDraftId: null,
        sectionPlan: sectionPlan.map((section) => ({
          sectionId: section.sectionId,
          title: section.title,
          guidance: section.guidance
        })),
        generationScope: { kind: "full" }
      });

      if (!begin.ok) {
        return {
          ok: false as const,
          errorCode: begin.errorCode,
          message: "Draft generation is already running for this chapter.",
          retryable: true
        };
      }

      const llm = createLlmRegistry(aiEnv);
      const promptText = buildChapterDraftPromptV2({
        templateId: storybook.templateId ?? null,
        chapterKey: chapter.chapterKey,
        chapterTitle: chapter.title,
        questionAnswers: groundedAnswers,
        narration,
        targetSections: sectionPlan
      });

      const generated = await llm.generateChapterDraft({
        templateId: storybook.templateId ?? null,
        chapterKey: chapter.chapterKey,
        chapterTitle: chapter.title,
        questionAnswers: groundedAnswers,
        narrationSettings: narration,
        targetSections: sectionPlan,
        promptText,
        timeoutMs: aiEnv.timeoutMs,
        maxWordsByLength: aiEnv.maxWordsByLength
      });

      const normalizedSections = normalizeGeneratedSectionsForFramework(sectionPlan, generated.sections);
      const validator = validateDraftOutputV1({
        sections: normalizedSections,
        entities: generated.entities
      });
      if (!validator.valid) {
        await ctx.runMutation(api.chapterDrafts.setError, {
          viewerSubject: viewer.subject,
          draftId: begin.draft.id,
          errorCode: validator.errors[0]?.code ?? "GENERATION_EMPTY",
          errorMessage: validator.errors[0]?.message ?? "Draft validation failed."
        });
        return {
          ok: false as const,
          errorCode: (validator.errors[0]?.code as StableAiErrorCode | undefined) ?? "GENERATION_EMPTY",
          message: validator.errors[0]?.message ?? "Draft validation failed.",
          retryable: true
        };
      }

      const quality = runDraftQualityChecks({
        sections: normalizedSections,
        summary: generated.summary,
        entities: generated.entities,
        answers: groundedAnswers.map((answer) => ({ questionId: answer.questionId, answerText: answer.answerText })),
        targetLength: narration.length
      });

      if (quality.errors.length > 0) {
        await ctx.runMutation(api.chapterDrafts.setError, {
          viewerSubject: viewer.subject,
          draftId: begin.draft.id,
          errorCode: quality.errors[0].code,
          errorMessage: quality.errors[0].message
        });
        return {
          ok: false as const,
          errorCode: "GENERATION_EMPTY" as const,
          message: quality.errors[0].message,
          retryable: true
        };
      }

      const ready = await ctx.runMutation(api.chapterDrafts.setReady, {
        viewerSubject: viewer.subject,
        draftId: begin.draft.id,
        summary: generated.summary,
        sections: normalizedSections,
        keyFacts: generated.keyFacts,
        quotes: generated.quotes,
        entities: generated.entities,
        imageIdeas: generated.imageIdeas,
        sourceAnswerIds: groundedAnswers.map((answer) => answer.questionId),
        warnings: combineWarnings(quality.warnings, validator.warnings)
      });

      return {
        ok: true as const,
        draft: ready.draft,
        provider: generated.provider,
        previousVersion: latestDraft?.version ?? null
      };
    } catch (error) {
      const mapped = mapAiActionError(error);
      return {
        ok: false as const,
        errorCode: mapped.code,
        message: mapped.message,
        retryable: mapped.retryable
      };
    }
  }
});

export const regenSectionV2 = action({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    sectionId: v.string()
  },
  handler: async (ctx, args) => {
    try {
      const viewer = await requireActionUser(ctx, args.viewerSubject);
      const aiEnv = getConvexAiEnv();
      const rate = checkAndRecordAiRateLimit(viewer.subject, aiEnv.rateLimitPerUserPerMinute);
      if (!rate.allowed) {
        return {
          ok: false as const,
          errorCode: "RATE_LIMIT" as const,
          message: "Section regeneration rate limit reached. Please try again shortly.",
          retryable: true
        };
      }

      const [storybook, chapter, answers, latestDraft] = await Promise.all([
        ctx.runQuery(api.storybooks.getGuidedById, {
          viewerSubject: viewer.subject,
          storybookId: args.storybookId
        }),
        ctx.runQuery(api.storybookChapters.get, {
          viewerSubject: viewer.subject,
          chapterInstanceId: args.chapterInstanceId
        }),
        ctx.runQuery(api.chapterAnswers.getByChapter, {
          viewerSubject: viewer.subject,
          chapterInstanceId: args.chapterInstanceId
        }),
        ctx.runQuery(api.chapterDrafts.getLatestByChapter, {
          viewerSubject: viewer.subject,
          chapterInstanceId: args.chapterInstanceId
        })
      ]);

      if (!latestDraft) {
        return {
          ok: false as const,
          errorCode: "INVALID_SECTION" as const,
          message: "Generate a draft first before regenerating a section.",
          retryable: false
        };
      }

      const sectionPlan = getSectionFrameworkForChapterKeyV2(chapter.chapterKey);
      const targetSection = sectionPlan.find((section) => section.sectionId === args.sectionId);
      if (!targetSection) {
        return {
          ok: false as const,
          errorCode: "INVALID_SECTION" as const,
          message: "Unknown section selected for regeneration.",
          retryable: false
        };
      }

      const templateResult = storybook.templateId
        ? await ctx.runQuery(api.templates.getById, { templateId: storybook.templateId })
        : null;
      const promptMap = buildAnswerPromptMap({
        templateId: storybook.templateId,
        chapterKey: chapter.chapterKey,
        chapterTitle: chapter.title,
        template: (templateResult as Record<string, unknown> | null) ?? null
      });

      const groundedAnswers = answers
        .filter((answer) => hasMeaningfulAnswer(answer))
        .map((answer) => ({
          questionId: answer.questionId,
          prompt: promptMap.get(answer.questionId) ?? `Question ${answer.questionId}`,
          answerText: (answer.answerText ?? "").trim()
        }))
        .filter((answer) => answer.answerText.length > 0);

      const narration = normalizeNarration((storybook.narration ?? null) as Record<string, unknown> | null);
      const begin = await ctx.runMutation(api.chapterDrafts.beginVersion, {
        viewerSubject: viewer.subject,
        storybookId: args.storybookId,
        chapterInstanceId: args.chapterInstanceId,
        chapterKey: chapter.chapterKey,
        narration,
        sourceAnswerIds: groundedAnswers.map((answer) => answer.questionId),
        seedFromDraftId: latestDraft.id,
        generationScope: { kind: "section", targetSectionId: args.sectionId }
      });
      if (!begin.ok) {
        return {
          ok: false as const,
          errorCode: begin.errorCode,
          message: "Draft generation is already running for this chapter.",
          retryable: true
        };
      }

      const llm = createLlmRegistry(aiEnv);
      const promptText = buildChapterDraftPromptV2({
        templateId: storybook.templateId ?? null,
        chapterKey: chapter.chapterKey,
        chapterTitle: chapter.title,
        questionAnswers: groundedAnswers,
        narration,
        targetSections: [targetSection]
      });
      const generated = await llm.generateChapterDraft({
        templateId: storybook.templateId ?? null,
        chapterKey: chapter.chapterKey,
        chapterTitle: chapter.title,
        questionAnswers: groundedAnswers,
        narrationSettings: narration,
        targetSections: [targetSection],
        promptText,
        timeoutMs: aiEnv.timeoutMs,
        maxWordsByLength: aiEnv.maxWordsByLength
      });

      const mergedSections = mergeRegeneratedSectionText(
        latestDraft.sections as ChapterDraftSection[],
        targetSection,
        generated.sections[0]
      );

      const validator = validateDraftOutputV1({
        sections: mergedSections,
        entities: latestDraft.entities
      });
      if (!validator.valid) {
        await ctx.runMutation(api.chapterDrafts.setError, {
          viewerSubject: viewer.subject,
          draftId: begin.draft.id,
          errorCode: validator.errors[0]?.code ?? "INVALID_SECTION",
          errorMessage: validator.errors[0]?.message ?? "Draft validation failed."
        });
        return {
          ok: false as const,
          errorCode: (validator.errors[0]?.code as StableAiErrorCode | undefined) ?? "INVALID_SECTION",
          message: validator.errors[0]?.message ?? "Draft validation failed.",
          retryable: true
        };
      }

      const quality = runDraftQualityChecks({
        sections: mergedSections,
        summary: latestDraft.summary,
        entities: latestDraft.entities,
        answers: groundedAnswers.map((answer) => ({ questionId: answer.questionId, answerText: answer.answerText })),
        targetLength: narration.length
      });

      if (quality.errors.length > 0) {
        await ctx.runMutation(api.chapterDrafts.setError, {
          viewerSubject: viewer.subject,
          draftId: begin.draft.id,
          errorCode: quality.errors[0].code,
          errorMessage: quality.errors[0].message
        });
        return {
          ok: false as const,
          errorCode: "GENERATION_EMPTY" as const,
          message: quality.errors[0].message,
          retryable: true
        };
      }

      const ready = await ctx.runMutation(api.chapterDrafts.setReady, {
        viewerSubject: viewer.subject,
        draftId: begin.draft.id,
        summary: latestDraft.summary,
        sections: mergedSections,
        keyFacts: latestDraft.keyFacts,
        quotes: latestDraft.quotes,
        entities: latestDraft.entities,
        imageIdeas: latestDraft.imageIdeas,
        sourceAnswerIds: latestDraft.sourceAnswerIds,
        warnings: combineWarnings(quality.warnings, validator.warnings)
      });

      return {
        ok: true as const,
        draft: ready.draft,
        provider: generated.provider,
        regeneratedSectionId: args.sectionId
      };
    } catch (error) {
      const mapped = mapAiActionError(error);
      return {
        ok: false as const,
        errorCode: mapped.code,
        message: mapped.message,
        retryable: mapped.retryable
      };
    }
  }
});
