import { serializeCropModelV1, resetCropModelV1 } from "../../editor/models/cropModel";
import type { MediaAttribution } from "../media/types";

export type IllustrationSlotAsset = {
  mediaAssetId: string;
  cachedUrl: string;
  thumbUrl: string | null;
  width: number;
  height: number;
  attribution: Record<string, unknown>;
  providerMetaSnapshot?: Record<string, unknown>;
};

export type ImageSlotMapResult = {
  slotImages: Record<
    string,
    {
      mediaAssetId: string;
      sourceUrl: string;
      previewUrl: string;
      attribution: MediaAttribution | null;
      crop: Record<string, unknown>;
    }
  >;
};

function toMediaAttribution(value: Record<string, unknown> | undefined): MediaAttribution | null {
  if (!value) return null;
  const provider = typeof value.provider === "string" ? value.provider : "system";
  return {
    provider,
    authorName: typeof value.authorName === "string" ? value.authorName : null,
    authorUrl: typeof value.authorUrl === "string" ? value.authorUrl : null,
    assetUrl: typeof value.assetUrl === "string" ? value.assetUrl : null,
    licenseUrl: typeof value.licenseUrl === "string" ? value.licenseUrl : null,
    attributionText: typeof value.attributionText === "string" ? value.attributionText : null
  };
}

export function mapIllustrationsToImageSlots(input: {
  slotIds: string[];
  slotAssets: Record<string, IllustrationSlotAsset | undefined>;
}) : ImageSlotMapResult {
  const slotImages: ImageSlotMapResult["slotImages"] = {};

  for (const slotId of input.slotIds) {
    const asset = input.slotAssets[slotId];
    if (!asset || !asset.cachedUrl) continue;

    slotImages[slotId] = {
      mediaAssetId: asset.mediaAssetId,
      sourceUrl: asset.cachedUrl,
      previewUrl: asset.thumbUrl ?? asset.cachedUrl,
      attribution: toMediaAttribution(asset.attribution),
      crop: serializeCropModelV1(resetCropModelV1(null, "frame"))
    };
  }

  return { slotImages };
}
