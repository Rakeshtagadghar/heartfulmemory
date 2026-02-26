export type IllustrationAssetProvider = "unsplash" | "pexels" | "upload" | "system";

export type MediaAssetAttribution = {
  authorName: string;
  authorUrl: string | null;
  assetUrl: string | null;
  licenseUrl: string | null;
  provider: IllustrationAssetProvider;
  attributionText: string;
};

export type MediaAssetRecord = {
  id: string;
  ownerUserId: string | null;
  type: "image";
  source: IllustrationAssetProvider;
  sourceId: string | null;
  cachedUrl: string;
  thumbUrl: string | null;
  width: number;
  height: number;
  mime: string | null;
  attribution: MediaAssetAttribution;
  createdAt: number;
};

export type ProviderAssetNormalized = {
  provider: "unsplash" | "pexels";
  id: string;
  thumbUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  authorName: string;
  authorUrl: string | null;
  assetUrl: string | null;
  licenseUrl: string | null;
  attributionText: string;
};
