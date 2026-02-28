import type { GuidedChapterInstance } from "../data/create-flow";

export type NextChapterRouteInput = {
  storybookId: string;
  chapter: GuidedChapterInstance | null;
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

  // Chapter complete — return to the storybook flow page where the single CTA routes next
  return {
    kind: "chapters" as const,
    href: `/book/${input.storybookId}/chapters`
  };
}
