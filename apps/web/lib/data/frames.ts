import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import { type DataResult } from "./_shared";
import { frameDtoSchema, type FrameDTO } from "../dto/frame";

export async function listFramesByPageForUser(
  viewerSubject: string,
  pageId: string
): Promise<DataResult<FrameDTO[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<unknown[]>(anyApi.frames.listByPage, { viewerSubject, pageId });
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => frameDtoSchema.parse(row)) };
}

export async function listFramesByStorybookForUser(
  viewerSubject: string,
  storybookId: string
): Promise<DataResult<FrameDTO[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<unknown[]>(anyApi.frames.listByStorybook, { viewerSubject, storybookId });
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => frameDtoSchema.parse(row)) };
}

export async function createFrameForUser(
  viewerSubject: string,
  pageId: string,
  input: {
    type: FrameDTO["type"];
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    style?: Record<string, unknown>;
    content?: Record<string, unknown>;
    locked?: boolean;
  }
): Promise<DataResult<FrameDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.frames.create, { viewerSubject, pageId, ...input });
  if (!result.ok) return result;
  return { ok: true, data: frameDtoSchema.parse(result.data) };
}

export async function updateFrameForUser(
  viewerSubject: string,
  frameId: string,
  patch: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    z_index?: number;
    locked?: boolean;
    style?: Record<string, unknown>;
    content?: Record<string, unknown>;
    crop?: Record<string, unknown> | null;
    expectedVersion?: number;
  }
): Promise<DataResult<FrameDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.frames.update, {
    viewerSubject,
    frameId,
    patch
  });
  if (!result.ok) {
    const isConflict = result.error.includes("CONFLICT:frame_version_mismatch");
    return { ...result, code: isConflict ? "conflict" : undefined };
  }
  return { ok: true, data: frameDtoSchema.parse(result.data) };
}

export async function removeFrameForUser(viewerSubject: string, frameId: string): Promise<DataResult<null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: boolean }>(anyApi.frames.remove, { viewerSubject, frameId });
  if (!result.ok) return result;
  return { ok: true, data: null };
}

