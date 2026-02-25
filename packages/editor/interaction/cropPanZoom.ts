import { normalizeCropModelV1, type CropModelV1 } from "../models/cropModel";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getCropZoomRange() {
  return { min: 1, max: 5 };
}

export function clampCropZoom(zoom: number) {
  const range = getCropZoomRange();
  return clamp(zoom, range.min, range.max);
}

export function constrainCropPanForMode(
  cropInput: CropModelV1 | Record<string, unknown> | null | undefined
): CropModelV1 {
  const crop = normalizeCropModelV1(cropInput as Record<string, unknown> | null | undefined);
  const rect = crop.rectNorm;
  const minX = rect.x;
  const maxX = rect.x + rect.w;
  const minY = rect.y;
  const maxY = rect.y + rect.h;

  const panX = crop.mode === "frame" ? clamp(crop.panNorm.x, minX, maxX) : clamp(crop.panNorm.x, 0, 1);
  const panY = crop.mode === "frame" ? clamp(crop.panNorm.y, minY, maxY) : clamp(crop.panNorm.y, 0, 1);

  return {
    ...crop,
    panNorm: { x: panX, y: panY }
  };
}

export function updateCropZoomConstrained(
  cropInput: CropModelV1 | Record<string, unknown> | null | undefined,
  zoom: number
) {
  const crop = normalizeCropModelV1(cropInput as Record<string, unknown> | null | undefined);
  return constrainCropPanForMode({
    ...crop,
    enabled: true,
    zoom: clampCropZoom(zoom)
  });
}

export function panCropWithinBounds(
  cropInput: CropModelV1 | Record<string, unknown> | null | undefined,
  input: { dxPx: number; dyPx: number; frameWidthPx: number; frameHeightPx: number }
) {
  const crop = normalizeCropModelV1(cropInput as Record<string, unknown> | null | undefined);
  const next = {
    ...crop,
    enabled: true,
    panNorm: {
      x: crop.panNorm.x - input.dxPx / Math.max(1, input.frameWidthPx * crop.zoom),
      y: crop.panNorm.y - input.dyPx / Math.max(1, input.frameHeightPx * crop.zoom)
    }
  };
  return constrainCropPanForMode(next);
}
