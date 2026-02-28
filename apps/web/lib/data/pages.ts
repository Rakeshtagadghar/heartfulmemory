import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import { type DataResult } from "./_shared";
import { pageDtoSchema, type PageDTO } from "../dto/page";

export async function listPagesByStorybookForUser(
  viewerSubject: string,
  storybookId: string
): Promise<DataResult<PageDTO[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<unknown[]>(anyApi.pages.listByStorybook, { viewerSubject, storybookId });
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => pageDtoSchema.parse(row)) };
}

export async function createPageForUser(
  viewerSubject: string,
  storybookId: string,
  input?: { sizePreset?: PageDTO["size_preset"] }
): Promise<DataResult<PageDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.pages.create, {
    viewerSubject,
    storybookId,
    sizePreset: input?.sizePreset
  });
  if (!result.ok) return result;
  return { ok: true, data: pageDtoSchema.parse(result.data) };
}

export async function updatePageForUser(
  viewerSubject: string,
  pageId: string,
  patch: Partial<Pick<PageDTO, "title" | "is_hidden" | "is_locked" | "size_preset" | "margins" | "grid" | "background">>
): Promise<DataResult<PageDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.pages.update, {
    viewerSubject,
    pageId,
    patch: {
      title: patch.title,
      isHidden: patch.is_hidden,
      isLocked: patch.is_locked,
      sizePreset: patch.size_preset,
      margins: patch.margins,
      grid: patch.grid,
      background: patch.background
    }
  });
  if (!result.ok) return result;
  return { ok: true, data: pageDtoSchema.parse(result.data) };
}

export async function reorderPagesForUser(
  viewerSubject: string,
  storybookId: string,
  orderedPageIds: string[]
): Promise<DataResult<null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: boolean }>(anyApi.pages.reorder, {
    viewerSubject,
    storybookId,
    orderedPageIds
  });
  if (!result.ok) return result;
  return { ok: true, data: null };
}

export async function removePageForUser(
  viewerSubject: string,
  pageId: string
): Promise<DataResult<null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: boolean }>(anyApi.pages.remove, {
    viewerSubject,
    pageId
  });
  if (!result.ok) return result;
  return { ok: true, data: null };
}

export async function duplicatePageForUser(
  viewerSubject: string,
  pageId: string
): Promise<DataResult<PageDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.pages.duplicate, {
    viewerSubject,
    pageId
  });
  if (!result.ok) return result;
  return { ok: true, data: pageDtoSchema.parse(result.data) };
}

export async function createDefaultCanvasForUser(
  viewerSubject: string,
  storybookId: string
): Promise<DataResult<PageDTO[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown[]>(anyApi.pages.createDefaultCanvas, {
    viewerSubject,
    storybookId
  });
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => pageDtoSchema.parse(row)) };
}
