import type {
  ChapterIllustrationRecord,
  ChapterStudioStateRecord,
  GuidedChapterInstance,
  ChapterDraftRecord
} from "../data/create-flow";

export type NextChapterRouteInput = {
  storybookId: string;
  chapter: GuidedChapterInstance | null;
  latestDraft: ChapterDraftRecord | null;
  latestIllustration: ChapterIllustrationRecord | null;
  studioState: ChapterStudioStateRecord | null;
};

export function resolveNextChapterRoute(input: NextChapterRouteInput) {
  const chapter = input.chapter;
  if (!chapter) {
    return {
      kind: "chapters" as const,
      href: `/book/${input.storybookId}/chapters`
    };
  }

  if (chapter.status !== "completed") {
    return {
      kind: "wizard" as const,
      href: `/book/${input.storybookId}/chapters/${chapter.id}/wizard`
    };
  }

  if (!input.latestDraft || input.latestDraft.status !== "ready") {
    return {
      kind: "draft" as const,
      href: `/book/${input.storybookId}/chapters/${chapter.id}/draft`
    };
  }

  if (!input.latestIllustration || input.latestIllustration.status !== "ready") {
    return {
      kind: "illustrations" as const,
      href: `/book/${input.storybookId}/chapters/${chapter.id}/illustrations`
    };
  }

  const pageParam = input.studioState?.pageIds[0] ? `&page=${encodeURIComponent(input.studioState.pageIds[0])}` : "";
  return {
    kind: "studio" as const,
    href: `/studio/${input.storybookId}?chapter=${encodeURIComponent(chapter.id)}${pageParam}`
  };
}
