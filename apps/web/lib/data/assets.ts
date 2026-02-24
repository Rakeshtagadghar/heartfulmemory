import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import { assetDtoSchema, type AssetDTO } from "../dto/asset";
import { type DataResult } from "./_shared";

export async function listAssetsForUser(
  viewerSubject: string,
  limit?: number
): Promise<DataResult<AssetDTO[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<unknown[]>(anyApi.assets.listMine, { viewerSubject, limit });
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => assetDtoSchema.parse(row)) };
}

export async function getAssetForUser(
  viewerSubject: string,
  assetId: string
): Promise<DataResult<AssetDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<unknown>(anyApi.assets.get, { viewerSubject, assetId });
  if (!result.ok) return result;
  return { ok: true, data: assetDtoSchema.parse(result.data) };
}

export async function createAssetMetadataForUser(
  viewerSubject: string,
  input: {
    source: AssetDTO["source"];
    source_asset_id?: string | null;
    source_url?: string | null;
    storage_provider?: string | null;
    storage_bucket?: string | null;
    storage_key?: string | null;
    mime_type?: string | null;
    width?: number | null;
    height?: number | null;
    duration_seconds?: number | null;
    size_bytes?: number | null;
    checksum?: string | null;
    license?: unknown;
  }
): Promise<DataResult<AssetDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.assets.createMetadata, {
    viewerSubject,
    source: input.source,
    sourceAssetId: input.source_asset_id ?? undefined,
    sourceUrl: input.source_url ?? undefined,
    storageProvider: input.storage_provider ?? undefined,
    storageBucket: input.storage_bucket ?? undefined,
    storageKey: input.storage_key ?? undefined,
    mimeType: input.mime_type ?? undefined,
    width: input.width ?? undefined,
    height: input.height ?? undefined,
    durationSeconds: input.duration_seconds ?? undefined,
    sizeBytes: input.size_bytes ?? undefined,
    checksum: input.checksum ?? undefined,
    license: input.license
  });
  if (!result.ok) return result;
  return { ok: true, data: assetDtoSchema.parse(result.data) };
}

// Backward-compatible wrappers.
export async function listAssets(viewerSubject = "dev:anonymous") {
  return listAssetsForUser(viewerSubject);
}

export async function createAssetMetadata(
  input: Omit<Partial<AssetDTO>, "id" | "owner_id" | "created_at" | "updated_at"> & {
    source: AssetDTO["source"];
  },
  viewerSubject = "dev:anonymous"
) {
  return createAssetMetadataForUser(viewerSubject, {
    source: input.source,
    source_asset_id: input.source_asset_id,
    source_url: input.source_url,
    storage_provider: input.storage_provider,
    storage_bucket: input.storage_bucket,
    storage_key: input.storage_key,
    mime_type: input.mime_type,
    width: input.width,
    height: input.height,
    duration_seconds: input.duration_seconds,
    size_bytes: input.size_bytes,
    checksum: input.checksum,
    license: input.license
  });
}

