import type { ProviderAssetNormalized } from "../../packages/shared/media/assetTypes";
import type { NormalizedStockResult } from "../../apps/web/lib/stock/types";

export function normalizeProviderAsset(input: NormalizedStockResult): ProviderAssetNormalized {
  return {
    provider: input.provider,
    id: input.assetId,
    thumbUrl: input.thumbUrl,
    fullUrl: input.fullUrl ?? input.previewUrl ?? input.thumbUrl,
    width: input.width ?? 0,
    height: input.height ?? 0,
    authorName: input.authorName,
    authorUrl: input.authorUrl ?? null,
    assetUrl: input.sourceUrl ?? null,
    licenseUrl: input.licenseUrl ?? null,
    attributionText: input.attributionText
  };
}

