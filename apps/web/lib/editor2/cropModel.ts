import {
  normalizeCropModelV1,
  panCropByDeltaV1
} from "../../../../packages/editor/models/cropModel";

export type CropState = ReturnType<typeof normalizeCropModelV1>;

export function normalizeCrop(input: Record<string, unknown> | null | undefined): CropState {
  return normalizeCropModelV1(input);
}

export function panCropByDelta(
  current: Record<string, unknown> | null | undefined,
  input: { dxPx: number; dyPx: number; frameWidthPx: number; frameHeightPx: number }
) {
  const next = panCropByDeltaV1(current, input);
  return {
    focalX: next.panNorm.x,
    focalY: next.panNorm.y,
    scale: next.zoom,
    ...next
  };
}

