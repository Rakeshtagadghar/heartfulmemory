import { anyApi, convexMutation, getConvexUrl } from "../convex/ops";
import { chapterDtoSchema, type ChapterDTO } from "../dto/chapter";
import { type DataResult } from "./_shared";

export async function createChapter(storybookId: string, title: string): Promise<DataResult<ChapterDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.chapters.createChapter, { storybookId, title });
  if (!result.ok) return result;
  return { ok: true, data: chapterDtoSchema.parse(result.data) };
}

export async function reorderChapters(
  storybookId: string,
  chapterOrder: string[]
): Promise<DataResult<null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.chapters.reorderChapters, { storybookId, chapterOrder });
  if (!result.ok) return result;
  return { ok: true, data: null };
}
