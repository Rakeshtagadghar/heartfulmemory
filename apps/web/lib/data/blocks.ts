import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import { blockDtoSchema, type BlockDTO } from "../dto/block";
import { type DataResult } from "./_shared";

export async function listChapterBlocksForUser(
  viewerSubject: string,
  chapterId: string
): Promise<DataResult<BlockDTO[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<unknown[]>(anyApi.blocks.listByChapter, { viewerSubject, chapterId });
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => blockDtoSchema.parse(row)) };
}

export async function insertBlockForUser(
  viewerSubject: string,
  input: {
    chapterId: string;
    type: BlockDTO["type"];
    content?: Record<string, unknown>;
    orderIndex?: number;
  }
): Promise<DataResult<BlockDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.blocks.insert, {
    viewerSubject,
    chapterId: input.chapterId,
    type: input.type,
    content: input.content ?? {},
    orderIndex: input.orderIndex
  });
  if (!result.ok) return result;
  return { ok: true, data: blockDtoSchema.parse(result.data) };
}

export async function updateBlockForUser(
  viewerSubject: string,
  blockId: string,
  patch: Partial<Pick<BlockDTO, "type" | "content">> & { expectedVersion?: number }
): Promise<DataResult<BlockDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.blocks.update, {
    viewerSubject,
    blockId,
    patch: {
      type: patch.type,
      content: patch.content,
      expectedVersion: patch.expectedVersion
    }
  });
  if (!result.ok) {
    const isConflict = result.error.includes("CONFLICT:block_version_mismatch");
    return {
      ...result,
      code: isConflict ? "conflict" : undefined
    };
  }
  return { ok: true, data: blockDtoSchema.parse(result.data) };
}

export async function removeBlockForUser(viewerSubject: string, blockId: string): Promise<DataResult<null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: boolean }>(anyApi.blocks.remove, { viewerSubject, blockId });
  if (!result.ok) return result;
  return { ok: true, data: null };
}

export async function reorderBlocksForUser(
  viewerSubject: string,
  chapterId: string,
  orderedBlockIds: string[]
): Promise<DataResult<null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: boolean }>(anyApi.blocks.reorder, {
    viewerSubject,
    chapterId,
    orderedBlockIds
  });
  if (!result.ok) return result;
  return { ok: true, data: null };
}

// Backward-compatible wrappers.
export async function listChapterBlocks(chapterId: string, viewerSubject = "dev:anonymous") {
  return listChapterBlocksForUser(viewerSubject, chapterId);
}

export async function upsertBlock(
  chapterId: string,
  block: {
    id?: string;
    storybook_id: string;
    type: BlockDTO["type"];
    order_index: number;
    content: Record<string, unknown>;
  },
  viewerSubject = "dev:anonymous"
) {
  if (block.id) {
    return updateBlockForUser(viewerSubject, block.id, { type: block.type, content: block.content });
  }
  return insertBlockForUser(viewerSubject, {
    chapterId,
    type: block.type,
    content: block.content,
    orderIndex: block.order_index
  });
}
