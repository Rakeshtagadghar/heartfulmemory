import type { ProviderAssetNormalized } from "../../packages/shared/media/assetTypes";

export type CachedImageResult = {
  cachedUrl: string;
  thumbUrl: string | null;
  width: number;
  height: number;
  mime: string | null;
  cacheMode: "passthrough" | "downloaded";
  sizeBytes: number | null;
};

function guessMimeFromUrl(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
  return null;
}

// Sprint 20 v1 keeps this abstraction swappable. In this repo runtime we default to a safe pass-through
// cache mode unless a storage backend is wired in later.
export async function cacheProviderImage(input: {
  providerAsset: ProviderAssetNormalized;
  maxDownloadBytes: number;
  timeoutMs: number;
}): Promise<CachedImageResult> {
  void input.maxDownloadBytes;
  void input.timeoutMs;

  return {
    cachedUrl: input.providerAsset.fullUrl,
    thumbUrl: input.providerAsset.thumbUrl ?? null,
    width: input.providerAsset.width,
    height: input.providerAsset.height,
    mime: guessMimeFromUrl(input.providerAsset.fullUrl),
    cacheMode: "passthrough",
    sizeBytes: null
  };
}

