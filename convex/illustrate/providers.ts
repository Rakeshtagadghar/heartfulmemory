"use node";

import type { ProviderAssetNormalized } from "../../packages/shared/media/assetTypes";
import type { NormalizedStockResult } from "../../apps/web/lib/stock/types";
import { searchUnsplash } from "../../apps/web/lib/stock/providers/unsplash";
import { searchPexels } from "../../apps/web/lib/stock/providers/pexels";
import { normalizeProviderAsset } from "../../lib/photos/normalizeProviderAsset";

export type ProviderMode = "unsplash" | "pexels" | "both";

export type ProviderSearchInput = {
  providerMode: ProviderMode;
  query: string;
  page?: number;
};

function toNormalized(results: NormalizedStockResult[]) {
  return results
    .map(normalizeProviderAsset)
    .filter((item) => item.fullUrl && item.thumbUrl);
}

export async function searchProviderAssets(input: ProviderSearchInput): Promise<ProviderAssetNormalized[]> {
  const page = Math.max(1, input.page ?? 1);
  if (input.providerMode === "unsplash") {
    return toNormalized(await searchUnsplash(input.query, page));
  }
  if (input.providerMode === "pexels") {
    return toNormalized(await searchPexels(input.query, page));
  }
  const [unsplash, pexels] = await Promise.allSettled([searchUnsplash(input.query, page), searchPexels(input.query, page)]);
  const combined: NormalizedStockResult[] = [];
  if (unsplash.status === "fulfilled") combined.push(...unsplash.value);
  if (pexels.status === "fulfilled") combined.push(...pexels.value);
  if (combined.length === 0) {
    let primaryReason: unknown = null;
    if (unsplash.status === "rejected") primaryReason = unsplash.reason;
    else if (pexels.status === "rejected") primaryReason = pexels.reason;
    throw primaryReason instanceof Error ? primaryReason : new Error("Both illustration providers failed");
  }
  return toNormalized(combined);
}
