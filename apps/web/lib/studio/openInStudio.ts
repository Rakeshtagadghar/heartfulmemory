import {
  getGuidedChapterByIdForUser,
  getLatestChapterDraftForUser,
  getLatestChapterIllustrationForUser,
  populateStudioChapterForUser
} from "../data/create-flow";
import type { DataResult } from "../data/_shared";
import { captureAppWarning } from "../../../../lib/observability/capture";
import { createCorrelationId } from "../../../../lib/observability/correlation";
import { withSentrySpan } from "../../../../lib/observability/spans";

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
      correlationId?: string;
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
  const [chapterResult, draftResult, illustrationResult] = await Promise.all([
    getGuidedChapterByIdForUser(viewerSubject, input.chapterInstanceId),
    getLatestChapterDraftForUser(viewerSubject, input.chapterInstanceId),
    getLatestChapterIllustrationForUser(viewerSubject, input.chapterInstanceId)
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
  if (draftResult.data?.status !== "ready") {
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
  if (illustrationResult.data?.status !== "ready") {
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

  const populate = await withSentrySpan(
    "studio_open_populate_chapter",
    {
      flow: "studio_open_populate",
      feature: "studio_open",
      storybookId: input.storybookId,
      chapterKey: chapter.chapterKey,
      chapterInstanceId: input.chapterInstanceId
    },
    () => populateStudioChapterForUser(viewerSubject, input)
  );
  if (!populate.ok) return { ok: false, error: populate.error };
  if (!populate.data.ok) {
    const correlationId = createCorrelationId();
    captureAppWarning("Studio chapter populate failed", {
      runtime: "server",
      flow: "studio_open_populate",
      feature: "studio_open",
      code: populate.data.errorCode,
      storybookId: input.storybookId,
      chapterKey: chapter.chapterKey,
      chapterInstanceId: input.chapterInstanceId,
      extra: {
        correlationId,
        retryable: populate.data.retryable ?? null
      }
    });
    return {
      ok: true,
      data: {
        ok: false,
        errorCode: populate.data.errorCode,
        message: populate.data.message,
        retryable: populate.data.retryable,
        correlationId
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
