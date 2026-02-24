"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "../auth/server";
import {
  createChapterForUser,
  listChaptersByStorybookForUser,
  removeChapterForUser,
  reorderChaptersForUser,
  renameChapterForUser
} from "../data/chapters";
import {
  insertBlockForUser,
  listChapterBlocksForUser,
  removeBlockForUser,
  updateBlockForUser
} from "../data/blocks";
import { updateStorybookForUser } from "../data/storybooks";
import type { DataResult } from "../data/_shared";
import type { BlockDTO } from "../dto/block";
import type { ChapterDTO } from "../dto/chapter";
import type { StorybookDTO } from "../dto/storybook";
import { createImagePlaceholderContent, createTextBlockContent } from "../editor/serialize";

type BlockUpdateContent = Record<string, unknown>;

function storybookPath(storybookId: string) {
  return `/app/storybooks/${storybookId}`;
}

export async function loadChapterBlocksAction(chapterId: string): Promise<DataResult<BlockDTO[]>> {
  const user = await requireAuthenticatedUser("/app");
  return listChapterBlocksForUser(user.id, chapterId);
}

export async function createChapterAction(
  storybookId: string,
  title?: string
): Promise<DataResult<ChapterDTO>> {
  const user = await requireAuthenticatedUser(storybookPath(storybookId));
  const result = await createChapterForUser(user.id, storybookId, title);
  revalidatePath(storybookPath(storybookId));
  return result;
}

export async function renameChapterAction(
  storybookId: string,
  chapterId: string,
  title: string
): Promise<DataResult<ChapterDTO>> {
  const user = await requireAuthenticatedUser(storybookPath(storybookId));
  const result = await renameChapterForUser(user.id, chapterId, title);
  revalidatePath(storybookPath(storybookId));
  return result;
}

export async function removeChapterAction(
  storybookId: string,
  chapterId: string
): Promise<DataResult<null>> {
  const user = await requireAuthenticatedUser(storybookPath(storybookId));
  const result = await removeChapterForUser(user.id, chapterId);
  revalidatePath(storybookPath(storybookId));
  return result;
}

export async function reorderChaptersAction(
  storybookId: string,
  orderedChapterIds: string[]
): Promise<DataResult<null>> {
  const user = await requireAuthenticatedUser(storybookPath(storybookId));
  const result = await reorderChaptersForUser(user.id, storybookId, orderedChapterIds);
  revalidatePath(storybookPath(storybookId));
  return result;
}

export async function renameStorybookAction(
  storybookId: string,
  patch: { title?: string; subtitle?: string | null }
): Promise<DataResult<StorybookDTO>> {
  const user = await requireAuthenticatedUser(storybookPath(storybookId));
  const result = await updateStorybookForUser(user.id, storybookId, patch);
  revalidatePath(storybookPath(storybookId));
  revalidatePath("/app");
  return result;
}

export async function insertTextBlockAction(
  storybookId: string,
  chapterId: string
): Promise<DataResult<BlockDTO>> {
  const user = await requireAuthenticatedUser(storybookPath(storybookId));
  return insertBlockForUser(user.id, {
    chapterId,
    type: "TEXT",
    content: createTextBlockContent()
  });
}

export async function insertImagePlaceholderBlockAction(
  storybookId: string,
  chapterId: string
): Promise<DataResult<BlockDTO>> {
  const user = await requireAuthenticatedUser(storybookPath(storybookId));
  return insertBlockForUser(user.id, {
    chapterId,
    type: "IMAGE",
    content: createImagePlaceholderContent()
  });
}

export async function updateBlockAction(
  storybookId: string,
  blockId: string,
  patch: { type?: BlockDTO["type"]; content?: BlockUpdateContent; expectedVersion?: number }
): Promise<DataResult<BlockDTO>> {
  const user = await requireAuthenticatedUser(storybookPath(storybookId));
  return updateBlockForUser(user.id, blockId, patch);
}

export async function removeBlockAction(
  storybookId: string,
  blockId: string
): Promise<DataResult<null>> {
  const user = await requireAuthenticatedUser(storybookPath(storybookId));
  return removeBlockForUser(user.id, blockId);
}

export async function listChaptersAction(storybookId: string): Promise<DataResult<ChapterDTO[]>> {
  const user = await requireAuthenticatedUser(storybookPath(storybookId));
  return listChaptersByStorybookForUser(user.id, storybookId);
}

