"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "../auth/server";
import { type DataResult } from "../data/_shared";
import { createDefaultCanvasForUser, createPageForUser, listPagesByStorybookForUser, reorderPagesForUser, updatePageForUser } from "../data/pages";
import { createFrameForUser, listFramesByPageForUser, listFramesByStorybookForUser, removeFrameForUser, updateFrameForUser } from "../data/frames";
import { updateStorybookSettingsForUser } from "../data/storybooks";
import type { PageDTO } from "../dto/page";
import type { FrameDTO } from "../dto/frame";
import type { StorybookDTO } from "../dto/storybook";

function storybookPath(storybookId: string) {
  return `/app/storybooks/${storybookId}`;
}

function layoutPath(storybookId: string) {
  return `/app/storybooks/${storybookId}/layout`;
}

export async function ensureLayoutCanvasAction(storybookId: string): Promise<DataResult<PageDTO[]>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await createDefaultCanvasForUser(user.id, storybookId);
  revalidatePath(layoutPath(storybookId));
  revalidatePath(storybookPath(storybookId));
  return result;
}

export async function listPagesAction(storybookId: string): Promise<DataResult<PageDTO[]>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  return listPagesByStorybookForUser(user.id, storybookId);
}

export async function createPageAction(
  storybookId: string,
  sizePreset?: PageDTO["size_preset"]
): Promise<DataResult<PageDTO>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await createPageForUser(user.id, storybookId, { sizePreset });
  revalidatePath(layoutPath(storybookId));
  return result;
}

export async function reorderPagesAction(
  storybookId: string,
  orderedPageIds: string[]
): Promise<DataResult<null>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await reorderPagesForUser(user.id, storybookId, orderedPageIds);
  revalidatePath(layoutPath(storybookId));
  return result;
}

export async function updatePageSettingsAction(
  storybookId: string,
  pageId: string,
  patch: Partial<Pick<PageDTO, "size_preset" | "margins" | "grid" | "background">>
): Promise<DataResult<PageDTO>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await updatePageForUser(user.id, pageId, patch);
  revalidatePath(layoutPath(storybookId));
  return result;
}

export async function listFramesByStorybookAction(storybookId: string): Promise<DataResult<FrameDTO[]>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  return listFramesByStorybookForUser(user.id, storybookId);
}

export async function listFramesByPageAction(pageId: string, storybookId: string): Promise<DataResult<FrameDTO[]>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  return listFramesByPageForUser(user.id, pageId);
}

export async function createFrameAction(
  storybookId: string,
  pageId: string,
  input: Parameters<typeof createFrameForUser>[2]
): Promise<DataResult<FrameDTO>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await createFrameForUser(user.id, pageId, input);
  revalidatePath(layoutPath(storybookId));
  return result;
}

export async function updateFrameAction(
  storybookId: string,
  frameId: string,
  patch: Parameters<typeof updateFrameForUser>[2]
): Promise<DataResult<FrameDTO>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await updateFrameForUser(user.id, frameId, patch);
  return result;
}

export async function removeFrameAction(storybookId: string, frameId: string): Promise<DataResult<null>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await removeFrameForUser(user.id, frameId);
  revalidatePath(layoutPath(storybookId));
  return result;
}

export async function updateLayoutStorybookSettingsAction(
  storybookId: string,
  settingsPatch: {
    pageSize?: "A4" | "US_LETTER" | "BOOK_6X9" | "BOOK_8_5X11";
    margins?: Record<string, unknown>;
    grid?: Record<string, unknown>;
    exportTargets?: { digitalPdf: boolean; printPdf: boolean };
  }
): Promise<DataResult<StorybookDTO>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await updateStorybookSettingsForUser(user.id, storybookId, settingsPatch);
  revalidatePath(layoutPath(storybookId));
  revalidatePath(storybookPath(storybookId));
  return result;
}
