import { anyApi, convexAction, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import type {
  GuidedTemplateSummary,
  GuidedTemplateV2
} from "../../../../packages/shared/templates/templateTypes";
import type {
  ChapterDraftEntitiesV2,
  ChapterEntityOverrides
} from "../../../../packages/shared/entities/entitiesTypes";
import { normalizeEntityDateValue } from "../../../../lib/entities/normalizeDates";
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
  flowStatus: string | null;
  photoStatus: string | null;
  extraAnswer: { text?: string | null; skipped: boolean; updatedAt: number } | null;
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
  answerJson: unknown;
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
  guidance?: string;
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
  entitiesV2?: ChapterDraftEntitiesV2 | null;
  imageIdeas: Array<{ query: string; reason: string; slotHint?: string }>;
  answersHash?: string | null;
  sourceAnswerIds: string[];
  warnings: Array<{ code: string; message: string; severity: "info" | "warning" | "error"; sectionId?: string }>;
  generationScope: { kind: "full" } | { kind: "section"; targetSectionId: string } | null;
  errorCode: string | null;
  errorMessage: string | null;
  approvedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type ChapterEntityOverridesRecord = ChapterEntityOverrides;

export type ChapterDraftActionResult =
  | { ok: true; draft: ChapterDraftRecord; provider: string }
  | { ok: false; errorCode: string; message: string; retryable?: boolean };

export type ProviderAssetCandidate = {
  provider: "unsplash" | "pexels";
  id: string;
  thumbUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  authorName: string;
  authorUrl: string | null;
  assetUrl: string | null;
  licenseUrl: string | null;
  attributionText: string;
  query?: string;
};

export type ChapterIllustrationRecord = {
  id: string;
  storybookId: string;
  chapterInstanceId: string;
  chapterKey: string;
  version: number;
  status: "selecting" | "ready" | "error";
  theme: { queries: string[]; keywords: string[]; negativeKeywords: string[] };
  slotTargets: Array<{
    slotId: string;
    aspectTarget: number;
    orientation: "landscape" | "portrait" | "square";
    minShortSidePx: number;
  }>;
  slotAssignments: Array<{
    slotId: string;
    mediaAssetId: string;
    providerMetaSnapshot: Record<string, unknown>;
  }>;
  lockedSlotIds: string[];
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
};

export type ChapterIllustrationSlotMap = {
  illustrationId: string;
  version: number;
  status: "selecting" | "ready" | "error";
  chapterInstanceId: string;
  chapterKey: string;
  slots: Record<
    string,
    {
      mediaAssetId: string;
      cachedUrl: string;
      thumbUrl: string | null;
      width: number;
      height: number;
      attribution: Record<string, unknown>;
      providerMetaSnapshot: Record<string, unknown>;
    }
  >;
};

export type UploadedIllustrationMediaAsset = {
  id: string;
  ownerUserId: string | null;
  source: "upload";
  cachedUrl: string;
  thumbUrl: string | null;
  width: number;
  height: number;
  mime: string | null;
  attribution: {
    authorName: string;
    authorUrl: string | null;
    assetUrl: string | null;
    licenseUrl: string | null;
    provider: "upload";
    attributionText: string;
  };
  createdAt: number;
};

export type ChapterStudioStateRecord = {
  id: string;
  storybookId: string;
  chapterInstanceId: string;
  chapterKey: string;
  status: "not_started" | "populated" | "edited" | "finalized";
  lastAppliedDraftVersion: number | null;
  lastAppliedIllustrationVersion: number | null;
  pageIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type StudioPopulateChapterResult =
  | {
      ok: true;
      storybookId: string;
      chapterInstanceId: string;
      chapterKey: string;
      pageIds: string[];
      firstPageId: string | null;
      createdNodeIds: string[];
      updatedNodeIds: string[];
      skippedNodeIds: string[];
      reused: boolean;
      skippedBecauseEdited: boolean;
      versions: { draftVersion: number; illustrationVersion: number };
      metadata?: Record<string, unknown>;
    }
  | {
      ok: false;
      errorCode: string;
      message: string;
      retryable?: boolean;
    };

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
    answerJson?: unknown;
    sttMeta?: GuidedChapterAnswer["sttMeta"];
    audioRef?: string | null;
    skipped?: boolean;
    source?: "text" | "voice" | "ai_narrated";
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
  const aiChapterDraftsApi = (anyApi as unknown as Record<string, { generateV2: unknown }>)[
    "ai/chapterDrafts_v2"
  ];
  const result = await convexAction<ChapterDraftActionResult>(aiChapterDraftsApi.generateV2, {
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
  const aiChapterDraftsApi = (anyApi as unknown as Record<string, { regenSectionV2: unknown }>)[
    "ai/chapterDrafts_v2"
  ];
  const result = await convexAction<ChapterDraftActionResult & { regeneratedSectionId?: string }>(
    aiChapterDraftsApi.regenSectionV2,
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

export async function getChapterEntityOverridesForUser(
  viewerSubject: string,
  chapterInstanceId: string
): Promise<DataResult<ChapterEntityOverridesRecord | null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<ChapterEntityOverridesRecord | null>(anyApi.chapterEntityOverrides.getByChapter, {
    viewerSubject,
    chapterInstanceId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function addChapterEntityOverrideForUser(
  viewerSubject: string,
  input:
    | { storybookId: string; chapterInstanceId: string; kind: "people"; value: string }
    | { storybookId: string; chapterInstanceId: string; kind: "places"; value: string }
    | { storybookId: string; chapterInstanceId: string; kind: "dates"; value: string; normalized: string }
): Promise<DataResult<{ ok: true; overrides: ChapterEntityOverridesRecord }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const trimmedValue = input.value.trim();
  if (!trimmedValue) return { ok: false, error: "Entity value is required." };
  if (input.kind === "people") {
    const result = await convexMutation<{ ok: true; overrides: ChapterEntityOverridesRecord }>(
      anyApi.chapterEntityOverrides.addPerson,
      {
        viewerSubject,
        storybookId: input.storybookId,
        chapterInstanceId: input.chapterInstanceId,
        entity: {
          value: trimmedValue,
          kind: "role",
          confidence: 1,
          citations: [],
          source: "override"
        }
      }
    );
    return result.ok ? result : { ok: false, error: result.error };
  }
  if (input.kind === "places") {
    const result = await convexMutation<{ ok: true; overrides: ChapterEntityOverridesRecord }>(
      anyApi.chapterEntityOverrides.addPlace,
      {
        viewerSubject,
        storybookId: input.storybookId,
        chapterInstanceId: input.chapterInstanceId,
        entity: {
          value: trimmedValue,
          confidence: 1,
          citations: [],
          source: "override"
        }
      }
    );
    return result.ok ? result : { ok: false, error: result.error };
  }
  const result = await convexMutation<{ ok: true; overrides: ChapterEntityOverridesRecord }>(anyApi.chapterEntityOverrides.addDate, {
    viewerSubject,
    storybookId: input.storybookId,
    chapterInstanceId: input.chapterInstanceId,
    entity: {
      value: trimmedValue,
      normalized: normalizeEntityDateValue(input.normalized || trimmedValue) ?? trimmedValue,
      confidence: 1,
      citations: [],
      source: "override"
    }
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function removeChapterEntityForUser(
  viewerSubject: string,
  input: { storybookId: string; chapterInstanceId: string; kind: "people" | "places" | "dates"; value: string }
): Promise<DataResult<{ ok: true; overrides: ChapterEntityOverridesRecord }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: true; overrides: ChapterEntityOverridesRecord }>(anyApi.chapterEntityOverrides.removeEntity, {
    viewerSubject,
    ...input
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function resetChapterEntityOverridesForUser(
  viewerSubject: string,
  input: { storybookId: string; chapterInstanceId: string }
): Promise<DataResult<{ ok: true; overrides: ChapterEntityOverridesRecord | null }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: true; overrides: ChapterEntityOverridesRecord | null }>(anyApi.chapterEntityOverrides.reset, {
    viewerSubject,
    ...input
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function listChapterIllustrationVersionsForUser(
  viewerSubject: string,
  chapterInstanceId: string
): Promise<DataResult<ChapterIllustrationRecord[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<ChapterIllustrationRecord[]>(anyApi.chapterIllustrations.listByChapter, {
    viewerSubject,
    chapterInstanceId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function getLatestChapterIllustrationForUser(
  viewerSubject: string,
  chapterInstanceId: string
): Promise<DataResult<ChapterIllustrationRecord | null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<ChapterIllustrationRecord | null>(anyApi.chapterIllustrations.getLatestByChapterInstance, {
    viewerSubject,
    chapterInstanceId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function getChapterIllustrationSlotMapForUser(
  viewerSubject: string,
  chapterInstanceId: string
): Promise<DataResult<ChapterIllustrationSlotMap | null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<ChapterIllustrationSlotMap | null>(anyApi.chapterIllustrations.getByChapterInstance, {
    viewerSubject,
    chapterInstanceId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function autoIllustrateChapterForUser(
  viewerSubject: string,
  input: {
    storybookId: string;
    chapterInstanceId: string;
    providerMode?: "unsplash" | "pexels" | "both";
    regenerate?: boolean;
  }
): Promise<
  DataResult<
    | { ok: true; illustration: ChapterIllustrationRecord; reused: boolean; warnings: Array<Record<string, unknown>> }
    | { ok: false; errorCode: string; message: string; retryable?: boolean }
  >
> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexAction<
    | { ok: true; illustration: ChapterIllustrationRecord; reused: boolean; warnings: Array<Record<string, unknown>> }
    | { ok: false; errorCode: string; message: string; retryable?: boolean }
  >(anyApi.chapterIllustrations.autoIllustrate, {
    viewerSubject,
    ...input
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function toggleIllustrationSlotLockForUser(
  viewerSubject: string,
  input: { illustrationId: string; slotId: string }
): Promise<DataResult<{ ok: true; illustration: ChapterIllustrationRecord }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: true; illustration: ChapterIllustrationRecord }>(
    anyApi.chapterIllustrations.toggleLockSlot,
    {
      viewerSubject,
      ...input
    }
  );
  return result.ok ? result : { ok: false, error: result.error };
}

export async function replaceIllustrationSlotAssignmentForUser(
  viewerSubject: string,
  input: {
    illustrationId: string;
    slotId: string;
    mediaAssetId: string;
    providerMetaSnapshot: Record<string, unknown>;
  }
): Promise<DataResult<{ ok: true; illustration: ChapterIllustrationRecord }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: true; illustration: ChapterIllustrationRecord }>(
    anyApi.chapterIllustrations.replaceSlotAssignment,
    {
      viewerSubject,
      ...input
    }
  );
  return result.ok ? result : { ok: false, error: result.error };
}

export async function fetchIllustrationCandidatesForUser(
  viewerSubject: string,
  input: {
    provider: "unsplash" | "pexels" | "both";
    queries: string[];
    orientation: "landscape" | "portrait" | "square";
    page?: number;
    perPage?: number;
    minShortSidePx?: number;
  }
): Promise<
  DataResult<
    | { ok: true; candidates: ProviderAssetCandidate[]; droppedLowRes: number }
    | { ok: false; errorCode: string; message: string; retryable?: boolean }
  >
> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const illustrateApi = (anyApi as unknown as Record<string, { fetchCandidates: unknown }>)["illustrate/fetchCandidates"];
  const result = await convexAction<
    | { ok: true; candidates: ProviderAssetCandidate[]; droppedLowRes: number }
    | { ok: false; errorCode: string; message: string; retryable?: boolean }
  >(illustrateApi.fetchCandidates, {
    viewerSubject,
    ...input
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function cacheIllustrationAssetsForUser(
  viewerSubject: string,
  assets: ProviderAssetCandidate[]
): Promise<
  DataResult<
    | {
        ok: true;
        assets: Array<{
          providerAsset: ProviderAssetCandidate;
          mediaAssetId: string;
          mediaAsset: {
            id: string;
            cachedUrl: string;
            thumbUrl: string | null;
            width: number;
            height: number;
            attribution: Record<string, unknown>;
          };
          reused: boolean;
          cacheMode: string;
        }>;
      }
    | { ok: false; errorCode: string; message: string; retryable?: boolean }
  >
> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const illustrateApi = (anyApi as unknown as Record<string, { cacheSelectedAssets: unknown }>)["illustrate/cacheAssets"];
  const result = await convexAction<
    | {
        ok: true;
        assets: Array<{
          providerAsset: ProviderAssetCandidate;
          mediaAssetId: string;
          mediaAsset: {
            id: string;
            cachedUrl: string;
            thumbUrl: string | null;
            width: number;
            height: number;
            attribution: Record<string, unknown>;
          };
          reused: boolean;
          cacheMode: string;
        }>;
      }
    | { ok: false; errorCode: string; message: string; retryable?: boolean }
  >(illustrateApi.cacheSelectedAssets, {
    viewerSubject,
    assets
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function listUploadedIllustrationMediaAssetsForUser(
  viewerSubject: string,
  limit = 30
): Promise<DataResult<UploadedIllustrationMediaAsset[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<
    Array<{
      id: string;
      ownerUserId: string | null;
      source: "upload" | "unsplash" | "pexels" | "system";
      cachedUrl: string;
      thumbUrl: string | null;
      width: number;
      height: number;
      mime: string | null;
      attribution: {
        authorName: string;
        authorUrl?: string | null;
        assetUrl?: string | null;
        licenseUrl?: string | null;
        provider: "upload" | "unsplash" | "pexels" | "system";
        attributionText: string;
      };
      createdAt: number;
    }>
  >(anyApi.mediaAssets.listMine, {
    viewerSubject,
    limit: Math.max(1, Math.min(200, Math.floor(limit)))
  });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    data: result.data
      .filter((asset) => asset.source === "upload")
      .map((asset) => ({
        id: asset.id,
        ownerUserId: asset.ownerUserId,
        source: "upload" as const,
        cachedUrl: asset.cachedUrl,
        thumbUrl: asset.thumbUrl ?? null,
        width: asset.width,
        height: asset.height,
        mime: asset.mime ?? null,
        attribution: {
          authorName: asset.attribution.authorName,
          authorUrl: asset.attribution.authorUrl ?? null,
          assetUrl: asset.attribution.assetUrl ?? null,
          licenseUrl: asset.attribution.licenseUrl ?? null,
          provider: "upload" as const,
          attributionText: asset.attribution.attributionText
        },
        createdAt: asset.createdAt
      }))
  };
}

export async function createUploadedIllustrationMediaAssetForUser(
  viewerSubject: string,
  input: {
    sourceId?: string | null;
    cachedUrl: string;
    thumbUrl?: string | null;
    width: number;
    height: number;
    mime?: string | null;
  }
): Promise<DataResult<{ mediaAssetId: string; mediaAsset: UploadedIllustrationMediaAsset; reused: boolean }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{
    ok: true;
    mediaAssetId: string;
    mediaAsset: {
      id: string;
      ownerUserId: string | null;
      source: "upload" | "unsplash" | "pexels" | "system";
      cachedUrl: string;
      thumbUrl: string | null;
      width: number;
      height: number;
      mime: string | null;
      attribution: {
        authorName: string;
        authorUrl?: string | null;
        assetUrl?: string | null;
        licenseUrl?: string | null;
        provider: "upload" | "unsplash" | "pexels" | "system";
        attributionText: string;
      };
      createdAt: number;
    };
    reused: boolean;
  }>(anyApi.mediaAssets.createOrGetBySource, {
    viewerSubject,
    ownerUserId: viewerSubject,
    source: "upload",
    sourceId: input.sourceId ?? null,
    cachedUrl: input.cachedUrl,
    thumbUrl: input.thumbUrl ?? input.cachedUrl,
    width: Math.max(1, Math.floor(input.width)),
    height: Math.max(1, Math.floor(input.height)),
    mime: input.mime ?? null,
    attribution: {
      authorName: "You",
      authorUrl: null,
      assetUrl: null,
      licenseUrl: null,
      provider: "upload",
      attributionText: "Uploaded by you"
    }
  });
  if (!result.ok) return { ok: false, error: result.error };
  if (result.data.mediaAsset.source !== "upload" || result.data.mediaAsset.attribution.provider !== "upload") {
    return { ok: false, error: "Unexpected media asset source." };
  }
  return {
    ok: true,
    data: {
      mediaAssetId: result.data.mediaAssetId,
      reused: result.data.reused,
      mediaAsset: {
        id: result.data.mediaAsset.id,
        ownerUserId: result.data.mediaAsset.ownerUserId,
        source: "upload",
        cachedUrl: result.data.mediaAsset.cachedUrl,
        thumbUrl: result.data.mediaAsset.thumbUrl ?? null,
        width: result.data.mediaAsset.width,
        height: result.data.mediaAsset.height,
        mime: result.data.mediaAsset.mime ?? null,
        attribution: {
          authorName: result.data.mediaAsset.attribution.authorName,
          authorUrl: result.data.mediaAsset.attribution.authorUrl ?? null,
          assetUrl: result.data.mediaAsset.attribution.assetUrl ?? null,
          licenseUrl: result.data.mediaAsset.attribution.licenseUrl ?? null,
          provider: "upload",
          attributionText: result.data.mediaAsset.attribution.attributionText
        },
        createdAt: result.data.mediaAsset.createdAt
      }
    }
  };
}

export async function listChapterStudioStateByStorybookForUser(
  viewerSubject: string,
  storybookId: string
): Promise<DataResult<ChapterStudioStateRecord[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<ChapterStudioStateRecord[]>(anyApi.chapterStudioState.listByStorybook, {
    viewerSubject,
    storybookId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function getChapterStudioStateForUser(
  viewerSubject: string,
  chapterInstanceId: string
): Promise<DataResult<ChapterStudioStateRecord | null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<ChapterStudioStateRecord | null>(anyApi.chapterStudioState.getByChapterInstance, {
    viewerSubject,
    chapterInstanceId
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function populateStudioChapterForUser(
  viewerSubject: string,
  input: { storybookId: string; chapterInstanceId: string }
): Promise<DataResult<StudioPopulateChapterResult>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexAction<StudioPopulateChapterResult>(anyApi.studioPopulate.populateChapter, {
    viewerSubject,
    ...input
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function markChapterStudioEditedForUser(
  viewerSubject: string,
  input: { storybookId: string; chapterInstanceId: string }
): Promise<DataResult<{ ok: true; state: ChapterStudioStateRecord }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: true; state: ChapterStudioStateRecord }>(anyApi.chapterStudioState.markEdited, {
    viewerSubject,
    ...input
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function markChapterStudioFinalizedForUser(
  viewerSubject: string,
  input: { storybookId: string; chapterInstanceId: string }
): Promise<DataResult<{ ok: true; state: ChapterStudioStateRecord }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: true; state: ChapterStudioStateRecord }>(
    anyApi.chapterStudioState.markFinalized,
    {
      viewerSubject,
      ...input
    }
  );
  return result.ok ? result : { ok: false, error: result.error };
}

// Sprint 28: flow state helpers

export async function setExtraAnswerForUser(
  viewerSubject: string,
  storybookId: string,
  input: { text?: string | null; skipped: boolean }
): Promise<DataResult<{ ok: true }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: true }>(anyApi.storybooks.setExtraAnswer, {
    viewerSubject,
    storybookId,
    text: input.text ?? null,
    skipped: input.skipped
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function setFlowStatusForUser(
  viewerSubject: string,
  storybookId: string,
  flowStatus: "needs_questions" | "needs_extra_question" | "needs_upload_photos" | "populating" | "ready_in_studio" | "error"
): Promise<DataResult<{ ok: true }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: true }>(anyApi.storybooks.setFlowStatus, {
    viewerSubject,
    storybookId,
    flowStatus
  });
  return result.ok ? result : { ok: false, error: result.error };
}

export async function setPhotoStatusForUser(
  viewerSubject: string,
  storybookId: string,
  photoStatus: "not_started" | "done" | "skipped"
): Promise<DataResult<{ ok: true }>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: true }>(anyApi.storybooks.setPhotoStatus, {
    viewerSubject,
    storybookId,
    photoStatus
  });
  return result.ok ? result : { ok: false, error: result.error };
}
