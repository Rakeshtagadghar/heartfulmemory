"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "../auth/server";
import { anyApi, convexQuery } from "../convex/ops";
import { type DataResult } from "../data/_shared";
import {
  createDefaultCanvasForUser,
  createPageForUser,
  duplicatePageForUser,
  listPagesByStorybookForUser,
  removePageForUser,
  reorderPagesForUser,
  updatePageForUser
} from "../data/pages";
import { createFrameForUser, listFramesByPageForUser, listFramesByStorybookForUser, removeFrameForUser, updateFrameForUser } from "../data/frames";
import { createAssetMetadataForUser, listAssetsForUser } from "../data/assets";
import { getMediaConfig } from "../config/media";
import { updateStorybookSettingsForUser } from "../data/storybooks";
import type { PageDTO } from "../dto/page";
import type { FrameDTO } from "../dto/frame";
import type { StorybookDTO } from "../dto/storybook";
import type { AssetDTO } from "../dto/asset";
import type { ExportMarginsPx, ExportPageSizePreset } from "../../../../packages/shared-schema/storybookSettings.types";

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

export async function duplicatePageAction(
  storybookId: string,
  pageId: string
): Promise<DataResult<PageDTO>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await duplicatePageForUser(user.id, pageId);
  revalidatePath(layoutPath(storybookId));
  return result;
}

export async function removePageAction(
  storybookId: string,
  pageId: string
): Promise<DataResult<null>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await removePageForUser(user.id, pageId);
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
    pageSize?: ExportPageSizePreset;
    margins?: ExportMarginsPx | Record<string, unknown>;
    grid?: Record<string, unknown>;
    exportTargets?: { digitalPdf: boolean; hardcopyPdf?: boolean; printPdf?: boolean };
    printPreset?: Record<string, unknown>;
    digitalPreset?: Record<string, unknown>;
  }
): Promise<DataResult<StorybookDTO>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await updateStorybookSettingsForUser(user.id, storybookId, settingsPatch);
  revalidatePath(layoutPath(storybookId));
  revalidatePath(storybookPath(storybookId));
  return result;
}

export type ExportHistoryItem = {
  id: string;
  storybookId: string;
  exportTarget: "DIGITAL_PDF" | "HARDCOPY_PRINT_PDF";
  exportHash: string;
  status: "SUCCESS" | "FAILED";
  pageCount: number;
  warningsCount: number;
  runtimeMs: number | null;
  fileKey: string | null;
  fileUrl: string | null;
  errorSummary: string | null;
  createdAt: string;
};

export async function listExportHistoryAction(
  storybookId: string,
  limit = 10
): Promise<DataResult<ExportHistoryItem[]>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await convexQuery<ExportHistoryItem[]>(anyApi.exports.listExportHistory, {
    viewerSubject: user.id,
    storybookId,
    limit
  });
  return result;
}

export async function listEditorAssetsAction(storybookId: string, limit = 40): Promise<DataResult<AssetDTO[]>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  return listAssetsForUser(user.id, limit);
}

export async function createUploadAssetAction(
  storybookId: string,
  input: {
    storageKey?: string | null;
    sourceUrl: string;
    mimeType: string;
    width?: number | null;
    height?: number | null;
    sizeBytes: number;
    checksum?: string | null;
  }
): Promise<DataResult<AssetDTO>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const mediaConfig = getMediaConfig();
  if (mediaConfig.uploads.maxUploadsPerUser) {
    const existing = await listAssetsForUser(user.id, mediaConfig.uploads.maxUploadsPerUser + 1);
    if (!existing.ok) {
      return existing;
    }
    const uploadCount = existing.data.filter((asset) => asset.source === "UPLOAD").length;
    if (uploadCount >= mediaConfig.uploads.maxUploadsPerUser) {
      return {
        ok: false,
        error: `Upload limit reached (${mediaConfig.uploads.maxUploadsPerUser} files).`
      };
    }
  }

  const result = await createAssetMetadataForUser(user.id, {
    source: "UPLOAD",
    source_url: input.sourceUrl,
    storage_provider: input.storageKey ? "R2" : "LOCAL_DEV",
    storage_bucket: process.env.R2_BUCKET ?? (input.storageKey ? null : "local-dev"),
    storage_key: input.storageKey ?? null,
    mime_type: input.mimeType,
    width: input.width ?? null,
    height: input.height ?? null,
    size_bytes: input.sizeBytes,
    checksum: input.checksum ?? null
  });
  if (result.ok) {
    revalidatePath(layoutPath(storybookId));
  }
  return result;
}

export async function createStockAssetAction(
  storybookId: string,
  input: {
    provider: "UNSPLASH" | "PEXELS";
    sourceAssetId: string;
    sourceUrl: string | null;
    previewUrl: string;
    fullUrl?: string | null;
    mimeType?: string | null;
    width?: number | null;
    height?: number | null;
    license: Record<string, unknown>;
  }
): Promise<DataResult<AssetDTO>> {
  const user = await requireAuthenticatedUser(layoutPath(storybookId));
  const result = await createAssetMetadataForUser(user.id, {
    source: input.provider,
    source_asset_id: input.sourceAssetId,
    source_url: input.fullUrl || input.previewUrl || input.sourceUrl || null,
    mime_type: input.mimeType ?? "image/jpeg",
    width: input.width ?? null,
    height: input.height ?? null,
    license: input.license
  });
  if (result.ok) {
    revalidatePath(layoutPath(storybookId));
  }
  return result;
}
