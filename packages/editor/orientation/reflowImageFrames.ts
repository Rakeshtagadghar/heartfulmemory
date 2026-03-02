import { DEFAULT_CROP_MODEL_V1, normalizeCropModelV1 } from "../models/cropModel";

/**
 * Check whether an image node's crop model needs resetting after reflow.
 *
 * The CropModelV1 uses normalized 0–1 coordinates independent of frame pixel
 * size, so most resizes are handled automatically by objectFit: "cover".
 *
 * Only reset the crop when the frame aspect ratio changes dramatically (>2x),
 * which would cause an extreme crop shift.
 *
 * @returns Updated crop record if reset is needed, or null if no change required.
 */
export function ensureCropSafeAfterReflow(
  node: { type: string; crop?: Record<string, unknown> | null },
  oldRect: { w: number; h: number },
  newRect: { w: number; h: number }
): Record<string, unknown> | null {
  if (node.type !== "image" && node.type !== "frame") return null;
  if (!node.crop) return null;

  const oldAspect = oldRect.w / Math.max(1, oldRect.h);
  const newAspect = newRect.w / Math.max(1, newRect.h);
  const ratio = oldAspect > 0 ? newAspect / oldAspect : 1;

  // If aspect ratio change is more than 2x in either direction, reset to cover-center
  if (ratio > 2 || ratio < 0.5) {
    const reset = normalizeCropModelV1(
      {
        ...DEFAULT_CROP_MODEL_V1,
        enabled: true,
        objectFit: "cover",
      } as unknown as Record<string, unknown>,
      { objectFit: "cover" }
    );
    return reset as unknown as Record<string, unknown>;
  }

  return null;
}
