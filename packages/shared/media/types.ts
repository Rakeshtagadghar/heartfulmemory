export type MediaAttribution = {
  provider: "upload" | "unsplash" | "pexels" | string;
  authorName?: string | null;
  authorUrl?: string | null;
  assetUrl?: string | null;
  licenseUrl?: string | null;
  attributionText?: string | null;
};

export type UploadAsset = {
  id: string;
  ownerId: string;
  fileName: string;
  mime: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  url: string;
  createdAt: string;
};

export type ProviderAsset = {
  provider: "unsplash" | "pexels" | string;
  providerId: string;
  thumbUrl: string;
  fullUrl: string;
  width: number | null;
  height: number | null;
  authorName: string;
  authorUrl: string | null;
  assetUrl: string | null;
  licenseUrl: string | null;
  attributionText: string;
};
