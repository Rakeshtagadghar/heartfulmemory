import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import { chapterDtoSchema, type ChapterDTO } from "../dto/chapter";
import { type DataResult } from "./_shared";

export async function createChapterForUser(
  viewerSubject: string,
  storybookId: string,
  title?: string
): Promise<DataResult<ChapterDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.chapters.create, { viewerSubject, storybookId, title });
  if (!result.ok) return result;
  return { ok: true, data: chapterDtoSchema.parse(result.data) };
}

export async function listChaptersByStorybookForUser(
  viewerSubject: string,
  storybookId: string
): Promise<DataResult<ChapterDTO[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<unknown[]>(anyApi.chapters.listByStorybook, {
    viewerSubject,
    storybookId
  });
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => chapterDtoSchema.parse(row)) };
}

export async function renameChapterForUser(
  viewerSubject: string,
  chapterId: string,
  title: string
): Promise<DataResult<ChapterDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.chapters.rename, { viewerSubject, chapterId, title });
  if (!result.ok) return result;
  return { ok: true, data: chapterDtoSchema.parse(result.data) };
}

export async function updateChapterForUser(
  viewerSubject: string,
  chapterId: string,
  patch: {
    title?: string;
    status?: ChapterDTO["status"];
    summary?: string | null;
  }
): Promise<DataResult<ChapterDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.chapters.update, { viewerSubject, chapterId, patch });
  if (!result.ok) return result;
  return { ok: true, data: chapterDtoSchema.parse(result.data) };
}

export async function removeChapterForUser(
  viewerSubject: string,
  chapterId: string
): Promise<DataResult<null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: boolean }>(anyApi.chapters.remove, { viewerSubject, chapterId });
  if (!result.ok) return result;
  return { ok: true, data: null };
}

export async function reorderChaptersForUser(
  viewerSubject: string,
  storybookId: string,
  orderedChapterIds: string[]
): Promise<DataResult<null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: boolean }>(anyApi.chapters.reorder, {
    viewerSubject,
    storybookId,
    orderedChapterIds
  });
  if (!result.ok) return result;
  return { ok: true, data: null };
}

// Backward-compatible wrappers.
export async function createChapter(storybookId: string, title: string, viewerSubject = "dev:anonymous") {
  return createChapterForUser(viewerSubject, storybookId, title);
}

export async function reorderChapters(storybookId: string, chapterOrder: string[], viewerSubject = "dev:anonymous") {
  return reorderChaptersForUser(viewerSubject, storybookId, chapterOrder);
}
