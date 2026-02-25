import type { UploadAsset } from "../../../../packages/shared/media/types";
import { createAssetMetadataForUser, listAssetsForUser } from "../data/assets";
import type { AssetDTO } from "../dto/asset";
import { getMediaConfig } from "../config/media";

export type StorageUploadInput = {
  fileName: string;
  mime: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  storageKey?: string | null;
  url: string;
};

export type StorageAdapter = {
  uploadFile: (userId: string, input: StorageUploadInput) => Promise<{ storageKey: string | null; url: string }>;
  deleteFile: (userId: string, storageKey: string) => Promise<void>;
  listUploads: (userId: string, limit?: number) => Promise<UploadAsset[]>;
  createUploadMetadata: (userId: string, input: StorageUploadInput) => Promise<UploadAsset>;
};

function toUploadAsset(asset: AssetDTO): UploadAsset {
  return {
    id: asset.id,
    ownerId: asset.owner_id,
    fileName: asset.storage_key?.split("/").at(-1) ?? "upload",
    mime: asset.mime_type ?? "image/*",
    sizeBytes: asset.size_bytes ?? 0,
    width: asset.width ?? null,
    height: asset.height ?? null,
    url:
      asset.storage_provider === "R2"
        ? `/api/assets/view/${asset.id}?purpose=preview`
        : (asset.source_url ?? ""),
    createdAt: asset.created_at
  };
}

async function createUploadMetadata(userId: string, input: StorageUploadInput): Promise<UploadAsset> {
  const media = getMediaConfig();
  if (!media.uploads.allowedMimePrefixes.some((prefix) => input.mime.startsWith(prefix))) {
    throw new Error("Only image uploads are allowed.");
  }
  if (input.sizeBytes > media.uploads.maxUploadBytes) {
    throw new Error(`File too large. Max ${media.uploads.maxUploadMb}MB.`);
  }
  if (media.uploads.maxUploadsPerUser) {
    const existing = await listUploads(userId, media.uploads.maxUploadsPerUser + 1);
    if (existing.length >= media.uploads.maxUploadsPerUser) {
      throw new Error(`Upload limit reached (${media.uploads.maxUploadsPerUser} files).`);
    }
  }

  const created = await createAssetMetadataForUser(userId, {
    source: "UPLOAD",
    source_url: input.url,
    storage_provider: input.storageKey ? "R2" : "LOCAL_DEV",
    storage_bucket: process.env.R2_BUCKET ?? (input.storageKey ? null : "local-dev"),
    storage_key: input.storageKey ?? null,
    mime_type: input.mime,
    width: input.width ?? null,
    height: input.height ?? null,
    size_bytes: input.sizeBytes
  });
  if (!created.ok) {
    throw new Error(created.error);
  }
  return toUploadAsset(created.data);
}

async function listUploads(userId: string, limit = 40): Promise<UploadAsset[]> {
  const listed = await listAssetsForUser(userId, limit);
  if (!listed.ok) {
    throw new Error(listed.error);
  }
  return listed.data.filter((asset) => asset.source === "UPLOAD").map(toUploadAsset);
}

export const storageAdapter: StorageAdapter = {
  async uploadFile(_userId, input) {
    return { storageKey: input.storageKey ?? null, url: input.url };
  },
  async deleteFile(userId, storageKey) {
    void userId;
    void storageKey;
    throw new Error("Delete upload is not implemented yet.");
  },
  listUploads,
  createUploadMetadata
};
