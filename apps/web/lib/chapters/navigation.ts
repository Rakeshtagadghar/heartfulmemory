import type { GuidedChapterInstance } from "../data/create-flow";

export type ChapterNeighbors = {
  index: number;
  current: GuidedChapterInstance;
  previous: GuidedChapterInstance | null;
  next: GuidedChapterInstance | null;
};

export function getChapterNeighbors(
  chapters: GuidedChapterInstance[],
  currentChapterInstanceId: string
): ChapterNeighbors | null {
  const ordered = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex);
  const index = ordered.findIndex((chapter) => chapter.id === currentChapterInstanceId);
  if (index < 0) return null;
  return {
    index,
    current: ordered[index],
    previous: ordered[index - 1] ?? null,
    next: ordered[index + 1] ?? null
  };
}
