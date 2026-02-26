import { anyApi, convexAction, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import type {
  GuidedTemplateSummary,
  GuidedTemplateV2
} from "../../../../packages/shared/templates/templateTypes";
import type { DataResult } from "./_shared";

export type GuidedTemplateForCreate = GuidedTemplateSummary & {
  chapterCount: number;
};

export type GuidedStorybookCreateResult = {
  storybookId: string;
  templateId: string | null;
  chapters: Array<{
    id: string;
    chapterKey: string;
    title: string;
    orderIndex: number;
    status: "not_started" | "in_progress" | "completed";
  }>;
};

export type GuidedStorybookHeader = {
  id: string;
  title: string;
  status: string;
  templateId: string | null;
  templateTitle: string | null;
  templateSubtitle: string | null;
  narration: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

export type GuidedChapterInstance = {
  id: string;
  storybookId: string;
  chapterKey: string;
  title: string;
  orderIndex: number;
  status: "not_started" | "in_progress" | "completed";
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type GuidedChapterProgress = {
  chapterInstanceId: string;
  chapterKey: string;
  answeredCount: number;
  skippedCount: number;
  totalQuestions: number;
  requiredQuestions: number;
};

export type GuidedChapterAnswer = {
  id: string;
  storybookId: string;
  chapterInstanceId: string;
  questionId: string;
  answerText: string | null;
  answerJson: unknown | null;
  sttMeta: {
    provider: "groq" | "elevenlabs";
    confidence?: number | null;
    durationMs?: number | null;
    providerRequestId?: string | null;
    mimeType?: string | null;
    bytes?: number | null;
  } | null;
  audioRef: string | null;
  skipped: boolean;
  source: "text" | "voice";
  version: number;
  createdAt: number;
  updatedAt: number;
};

export type GuidedAnswerUpsertResult = {
  ok: true;
  answer: GuidedChapterAnswer;
  chapterStatus: "not_started" | "in_progress" | "completed";
};

export type GuidedChapterCompleteResult =
  | {
      ok: true;
      chapter: GuidedChapterInstance;
    }
  | {
      ok: false;
      errorCode: "MISSING_REQUIRED_ANSWERS";
      missingQuestionIds: string[];
    };

export type GuidedNarrationSettings = {
  voice: "first_person" | "third_person";
  tense: "past" | "present";
  tone: "warm" | "formal" | "playful" | "poetic";
  length: "short" | "medium" | "long";
};

export type ChapterDraftSection = {
  sectionId: string;
  title: string;
  text: string;
  wordCount: number;
  citations: string[];
  uncertain?: boolean;
};

export type ChapterDraftRecord = {
  id: string;
  storybookId: string;
  chapterInstanceId: string;
  chapterKey: string;
  version: number;
  status: "generating" | "ready" | "error";
  narration: GuidedNarrationSettings;
  sections: ChapterDraftSection[];
  summary: string;
  keyFacts: Array<{ text: string; citations: string[]; uncertain?: boolean }>;
  quotes: Array<{ text: string; speaker?: string; citations: string[]; uncertain?: boolean }>;
  entities: { people: string[]; places: string[]; dates: string[] };
  imageIdeas: Array<{ query: string; reason: string; slotHint?: string }>;
  sourceAnswerIds: string[];
  warnings: Array<{ code: string; message: string; severity: "info" | "warning" | "error"; sectionId?: string }>;
  generationScope: { kind: "full" } | { kind: "section"; targetSectionId: string } | null;
  errorCode: string | null;
  errorMessage: string | null;
  approvedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type ChapterDraftActionResult =
  | { ok: true; draft: ChapterDraftRecord; provider: string }
  | { ok: false; errorCode: string; message: string; retryable?: boolean };

export async function listActiveGuidedTemplates(): Promise<DataResult<GuidedTemplateForCreate[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<GuidedTemplateForCreate[]>(anyApi.templates.getActive, {});
  return result.ok ? result : { ok: false, error: result.error };
}

export async function getGuidedTemplateById(
  templateId: string
): Promise<DataResult<GuidedTemplateV2 | null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<GuidedTemplateV2 | null>(anyApi.templates.getById, {
    templateId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function createGuidedStorybookForUser(
  viewerSubject: string,
  input: {
    templateId?: string | null;
    optionalTitle?: string | null;
    clientRequestId: string;
  }
): Promise<DataResult<GuidedStorybookCreateResult>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };

  const result = await convexMutation<GuidedStorybookCreateResult>(anyApi.storybooks.createGuided, {
    viewerSubject,
    templateId: input.templateId ?? null,
    optionalTitle: input.optionalTitle ?? null,
    clientRequestId: input.clientRequestId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function getGuidedStorybookByIdForUser(
  viewerSubject: string,
  storybookId: string
): Promise<DataResult<GuidedStorybookHeader>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<GuidedStorybookHeader>(anyApi.storybooks.getGuidedById, {
    viewerSubject,
    storybookId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function listGuidedChaptersByStorybookForUser(
  viewerSubject: string,
  storybookId: string
): Promise<DataResult<GuidedChapterInstance[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<GuidedChapterInstance[]>(anyApi.storybookChapters.listByStorybook, {
    viewerSubject,
    storybookId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function getGuidedChapterByIdForUser(
  viewerSubject: string,
  chapterInstanceId: string
): Promise<DataResult<GuidedChapterInstance>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<GuidedChapterInstance>(anyApi.storybookChapters.get, {
    viewerSubject,
    chapterInstanceId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function getGuidedChapterProgressByStorybookForUser(
  viewerSubject: string,
  storybookId: string
): Promise<DataResult<GuidedChapterProgress[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<GuidedChapterProgress[]>(anyApi.chapterAnswers.progressByChapter, {
    viewerSubject,
    storybookId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function listGuidedChapterAnswersForUser(
  viewerSubject: string,
  chapterInstanceId: string
): Promise<DataResult<GuidedChapterAnswer[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<GuidedChapterAnswer[]>(anyApi.chapterAnswers.getByChapter, {
    viewerSubject,
    chapterInstanceId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function upsertGuidedChapterAnswerForUser(
  viewerSubject: string,
  input: {
    storybookId: string;
    chapterInstanceId: string;
    questionId: string;
    answerText?: string | null;
    answerJson?: unknown | null;
    sttMeta?: GuidedChapterAnswer["sttMeta"];
    audioRef?: string | null;
    skipped?: boolean;
    source?: "text" | "voice";
  }
): Promise<DataResult<GuidedAnswerUpsertResult>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<GuidedAnswerUpsertResult>(anyApi.chapterAnswers.upsert, {
    viewerSubject,
    ...input
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function completeGuidedChapterForUser(
  viewerSubject: string,
  chapterInstanceId: string
): Promise<DataResult<GuidedChapterCompleteResult>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<GuidedChapterCompleteResult>(anyApi.storybookChapters.complete, {
    viewerSubject,
    chapterInstanceId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function updateGuidedNarrationForUser(
  viewerSubject: string,
  storybookId: string,
  narration: GuidedNarrationSettings
): Promise<DataResult<{ ok: boolean; storybookId: string; narration: GuidedNarrationSettings }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: boolean; storybookId: string; narration: GuidedNarrationSettings }>(
    anyApi.storybooks.updateNarration,
    {
      viewerSubject,
      storybookId,
      narration
    }
  );
  return result.ok ? result : { ok: false, error: result.error };
}

export async function getLatestChapterDraftForUser(
  viewerSubject: string,
  chapterInstanceId: string
): Promise<DataResult<ChapterDraftRecord | null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<ChapterDraftRecord | null>(anyApi.chapterDrafts.getLatestByChapter, {
    viewerSubject,
    chapterInstanceId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function listChapterDraftVersionsForUser(
  viewerSubject: string,
  chapterInstanceId: string
): Promise<DataResult<ChapterDraftRecord[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<ChapterDraftRecord[]>(anyApi.chapterDrafts.listByChapter, {
    viewerSubject,
    chapterInstanceId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function generateChapterDraftForUser(
  viewerSubject: string,
  input: { storybookId: string; chapterInstanceId: string }
): Promise<DataResult<ChapterDraftActionResult>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const aiChapterDraftsApi = (anyApi as unknown as Record<string, { generate: unknown }>)[
    "ai/chapterDrafts"
  ];
  const result = await convexAction<ChapterDraftActionResult>(aiChapterDraftsApi.generate, {
    viewerSubject,
    ...input
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function regenChapterDraftSectionForUser(
  viewerSubject: string,
  input: { storybookId: string; chapterInstanceId: string; sectionId: string }
): Promise<DataResult<ChapterDraftActionResult & { regeneratedSectionId?: string }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const aiChapterDraftsApi = (anyApi as unknown as Record<string, { regenSection: unknown }>)[
    "ai/chapterDrafts"
  ];
  const result = await convexAction<ChapterDraftActionResult & { regeneratedSectionId?: string }>(
    aiChapterDraftsApi.regenSection,
    {
      viewerSubject,
      ...input
    }
  );
  return result.ok ? result : { ok: false, error: result.error };
}

export async function approveChapterDraftForUser(
  viewerSubject: string,
  draftId: string
): Promise<DataResult<{ ok: true; draftId: string; approvedAt: number }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: true; draftId: string; approvedAt: number }>(anyApi.chapterDrafts.approve, {
    viewerSubject,
    draftId
  });
  return result.ok ? result : { ok: false, error: result.error };
}
