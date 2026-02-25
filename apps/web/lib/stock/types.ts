export type StockProviderId = "unsplash" | "pexels";

export type NormalizedStockResult = {
  provider: StockProviderId;
  assetId: string;
  thumbUrl: string;
  previewUrl: string;
  fullUrl: string | null;
  width: number | null;
  height: number | null;
  authorName: string;
  authorUrl: string | null;
  sourceUrl: string | null;
  licenseName: string;
  licenseUrl: string | null;
  requiresAttribution: boolean;
  attributionText: string;
};
