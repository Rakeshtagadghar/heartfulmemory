import { serializeCropModelV1, resetCropModelV1 } from "../../editor/models/cropModel";
import type { ImageSlotMapResult } from "./imageSlotMapper";

export type StorybookPhotoAsset = {
  mediaAssetId: string;
  sourceUrl: string;
  width: number | null;
  height: number | null;
};

/**
 * Maps uploaded storybook photos to image slots sequentially:
 * slotIds[0] gets photos[0], slotIds[1] gets photos[1], etc.
 * If there are fewer photos than slots, remaining slots are left empty.
 */
export function mapPhotosToImageSlots(input: {
  slotIds: string[];
  photos: StorybookPhotoAsset[];
}): ImageSlotMapResult {
  const slotImages: ImageSlotMapResult["slotImages"] = {};

  for (let i = 0; i < input.slotIds.length; i++) {
    const slotId = input.slotIds[i];
    const photo = input.photos[i];
    if (!slotId || !photo || !photo.sourceUrl) continue;

    slotImages[slotId] = {
      mediaAssetId: photo.mediaAssetId,
      sourceUrl: photo.sourceUrl,
      previewUrl: photo.sourceUrl,
      attribution: null,
      crop: serializeCropModelV1(resetCropModelV1(null, "frame"))
    };
  }

  return { slotImages };
}
