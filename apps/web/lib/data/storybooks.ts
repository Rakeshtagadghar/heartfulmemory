import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import { storybookDtoSchema, storybookPatchSchema, type StorybookDTO } from "../dto/storybook";
import { type DataResult } from "./_shared";

type BookMode = StorybookDTO["book_mode"];

export async function createStorybookForUser(
  viewerSubject: string,
  input?: { title?: string; bookMode?: BookMode; templateId?: string; templateVersion?: number }
): Promise<DataResult<StorybookDTO>> {
  if (!getConvexUrl()) {
    return { ok: false, error: "Convex is not configured." };
  }

  const result = await convexMutation<unknown>(anyApi.storybooks.create, {
    viewerSubject,
    title: input?.title,
    bookMode: input?.bookMode,
    templateId: input?.templateId,
    templateVersion: input?.templateVersion
  });
  if (!result.ok) return result;
  return { ok: true, data: storybookDtoSchema.parse(result.data) };
}

export async function listStorybooksForUser(viewerSubject: string): Promise<DataResult<StorybookDTO[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<unknown[]>(anyApi.storybooks.listMine, { viewerSubject });
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => storybookDtoSchema.parse(row)) };
}

export async function getStorybookForUser(
  viewerSubject: string,
  storybookId: string
): Promise<DataResult<StorybookDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<unknown>(anyApi.storybooks.get, { viewerSubject, storybookId });
  if (!result.ok) return result;
  return { ok: true, data: storybookDtoSchema.parse(result.data) };
}

export async function updateStorybookForUser(
  viewerSubject: string,
  storybookId: string,
  patch: unknown
): Promise<DataResult<StorybookDTO>> {
  const parsed = storybookPatchSchema.safeParse(patch);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid patch." };
  }
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };

  const result = await convexMutation<unknown>(anyApi.storybooks.update, {
    viewerSubject,
    storybookId,
    patch: parsed.data
  });
  if (!result.ok) return result;
  return { ok: true, data: storybookDtoSchema.parse(result.data) };
}

export async function archiveStorybookForUser(
  viewerSubject: string,
  storybookId: string
): Promise<DataResult<null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: boolean }>(anyApi.storybooks.archive, { viewerSubject, storybookId });
  if (!result.ok) return result;
  return { ok: true, data: null };
}

export async function updateStorybookSettingsForUser(
  viewerSubject: string,
  storybookId: string,
  settingsPatch: {
    pageSize?: "A4" | "US_LETTER" | "BOOK_6X9" | "BOOK_8_5X11";
    margins?: Record<string, unknown>;
    grid?: Record<string, unknown>;
    exportTargets?: { digitalPdf: boolean; printPdf: boolean };
  }
): Promise<DataResult<StorybookDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.storybooks.updateSettings, {
    viewerSubject,
    storybookId,
    settingsPatch
  });
  if (!result.ok) return result;
  return { ok: true, data: storybookDtoSchema.parse(result.data) };
}

export async function removeStorybookForUser(
  viewerSubject: string,
  storybookId: string
): Promise<DataResult<null>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<{ ok: boolean }>(anyApi.storybooks.remove, { viewerSubject, storybookId });
  if (!result.ok) return result;
  return { ok: true, data: null };
}

// Backward-compatible wrappers used in earlier sprint stubs.
export async function createStorybook(
  title: string,
  mode: BookMode = "DIGITAL",
  viewerSubject = "dev:anonymous"
) {
  return createStorybookForUser(viewerSubject, { title, bookMode: mode });
}

export async function listStorybooks(viewerSubject = "dev:anonymous") {
  return listStorybooksForUser(viewerSubject);
}

export async function getStorybook(storybookId: string, viewerSubject = "dev:anonymous") {
  return getStorybookForUser(viewerSubject, storybookId);
}

export async function updateStorybook(storybookId: string, patch: unknown, viewerSubject = "dev:anonymous") {
  return updateStorybookForUser(viewerSubject, storybookId, patch);
}
