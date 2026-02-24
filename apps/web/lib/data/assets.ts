import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";
import { assetDtoSchema, type AssetDTO } from "../dto/asset";
import { type DataResult } from "./_shared";

export async function listAssets(): Promise<DataResult<AssetDTO[]>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexQuery<unknown[]>(anyApi.assets.listAssets, {});
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((row) => assetDtoSchema.parse(row)) };
}

export async function createAssetMetadata(
  input: Omit<Partial<AssetDTO>, "id" | "owner_id" | "created_at" | "updated_at"> & {
    source: AssetDTO["source"];
  }
): Promise<DataResult<AssetDTO>> {
  if (!getConvexUrl()) return { ok: false, error: "Convex is not configured." };
  const result = await convexMutation<unknown>(anyApi.assets.createAssetMetadata, { input });
  if (!result.ok) return result;
  return { ok: true, data: assetDtoSchema.parse(result.data) };
}
