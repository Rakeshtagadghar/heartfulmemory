import {
  getChapterStudioStateForUser,
  getGuidedChapterByIdForUser,
  getLatestChapterDraftForUser,
  getLatestChapterIllustrationForUser,
  populateStudioChapterForUser
} from "../data/create-flow";
import type { DataResult } from "../data/_shared";

export type OpenInStudioResolution =
  | {
      ok: true;
      href: string;
      chapterKey: string;
      populated: boolean;
      reused: boolean;
      pageIds: string[];
    }
  | {
      ok: false;
      errorCode: string;
      message: string;
      retryable?: boolean;
      href?: string;
    };

function studioHref(storybookId: string, chapterInstanceId: string, firstPageId?: string | null) {
  const qs = new URLSearchParams();
  qs.set("chapter", chapterInstanceId);
  if (firstPageId) qs.set("page", firstPageId);
  return `/studio/${storybookId}?${qs.toString()}`;
}

export async function resolveOpenInStudioForUser(
  viewerSubject: string,
  input: { storybookId: string; chapterInstanceId: string }
): Promise<DataResult<OpenInStudioResolution>> {
  const [chapterResult, draftResult, illustrationResult, studioStateResult] = await Promise.all([
    getGuidedChapterByIdForUser(viewerSubject, input.chapterInstanceId),
    getLatestChapterDraftForUser(viewerSubject, input.chapterInstanceId),
    getLatestChapterIllustrationForUser(viewerSubject, input.chapterInstanceId),
    getChapterStudioStateForUser(viewerSubject, input.chapterInstanceId)
  ]);

  if (!chapterResult.ok) return chapterResult;
  const chapter = chapterResult.data;

  if (chapter.status !== "completed") {
    return {
      ok: true,
      data: {
        ok: true,
        href: `/book/${input.storybookId}/chapters/${input.chapterInstanceId}/wizard`,
        chapterKey: chapter.chapterKey,
        populated: false,
        reused: true,
        pageIds: []
      }
    };
  }

  if (!draftResult.ok) return { ok: false, error: draftResult.error };
  if (!draftResult.data || draftResult.data.status !== "ready") {
    return {
      ok: true,
      data: {
        ok: true,
        href: `/book/${input.storybookId}/chapters/${input.chapterInstanceId}/draft`,
        chapterKey: chapter.chapterKey,
        populated: false,
        reused: true,
        pageIds: []
      }
    };
  }

  if (!illustrationResult.ok) return { ok: false, error: illustrationResult.error };
  if (!illustrationResult.data || illustrationResult.data.status !== "ready") {
    return {
      ok: true,
      data: {
        ok: true,
        href: `/book/${input.storybookId}/chapters/${input.chapterInstanceId}/illustrations`,
        chapterKey: chapter.chapterKey,
        populated: false,
        reused: true,
        pageIds: []
      }
    };
  }

  const populate = await populateStudioChapterForUser(viewerSubject, input);
  if (!populate.ok) return { ok: false, error: populate.error };
  if (!populate.data.ok) {
    return {
      ok: true,
      data: {
        ok: false,
        errorCode: populate.data.errorCode,
        message: populate.data.message,
        retryable: populate.data.retryable
      }
    };
  }

  return {
    ok: true,
    data: {
      ok: true,
      href: studioHref(input.storybookId, input.chapterInstanceId, populate.data.firstPageId),
      chapterKey: chapter.chapterKey,
      populated: true,
      reused: populate.data.reused,
      pageIds: populate.data.pageIds
    }
  };
}
