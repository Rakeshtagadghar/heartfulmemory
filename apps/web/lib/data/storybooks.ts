import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import { storybookDtoSchema, storybookPatchSchema, type StorybookDTO } from "../dto/storybook";
import { type DataResult } from "./_shared";

export async function createStorybook(
  title: string,
  mode: "DIGITAL" | "PRINT" = "DIGITAL"
): Promise<DataResult<StorybookDTO>> {
  if (!getConvexUrl()) {
    return { ok: false, error: "Convex is not configured." };
  }

  const result = await convexMutation<unknown>(anyApi.storybooks.createStorybook, { title, mode });
  if (!result.ok) return result;
  return { ok: true, data: storybookDtoSchema.parse(result.data) };
}

export async function listStorybooks(): Promise<DataResult<StorybookDTO[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };

  const result = await convexQuery<unknown[]>(anyApi.storybooks.listStorybooks, {});
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => storybookDtoSchema.parse(row)) };
}

export async function getStorybook(id: string): Promise<DataResult<StorybookDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };

  const result = await convexQuery<unknown>(anyApi.storybooks.getStorybook, { id });
  if (!result.ok) return result;
  return { ok: true, data: storybookDtoSchema.parse(result.data) };
}

export async function updateStorybook(id: string, patch: unknown): Promise<DataResult<StorybookDTO>> {
  const parsed = storybookPatchSchema.safeParse(patch);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid patch." };
  }

  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };

  const result = await convexMutation<unknown>(anyApi.storybooks.updateStorybook, { id, patch: parsed.data });
  if (!result.ok) return result;
  return { ok: true, data: storybookDtoSchema.parse(result.data) };
}
