import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import { blockDtoSchema, type BlockDTO } from "../dto/block";
import { type DataResult } from "./_shared";

export async function upsertBlock(
  chapterId: string,
  block: {
    id?: string;
    storybook_id: string;
    type: BlockDTO["type"];
    order_index: number;
    content: Record<string, unknown>;
  }
): Promise<DataResult<BlockDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.blocks.upsertBlock, { chapterId, block });
  if (!result.ok) return result;
  return { ok: true, data: blockDtoSchema.parse(result.data) };
}

export async function listChapterBlocks(chapterId: string): Promise<DataResult<BlockDTO[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<unknown[]>(anyApi.blocks.listChapterBlocks, { chapterId });
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => blockDtoSchema.parse(row)) };
}
