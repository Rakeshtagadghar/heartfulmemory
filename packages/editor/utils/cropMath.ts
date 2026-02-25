import { normalizeCropModelV1 } from "../models/cropModel";

export function getCropImagePresentation(
  cropInput: Record<string, unknown> | null | undefined,
  options?: { objectFit?: "cover" | "contain" }
) {
  const crop = normalizeCropModelV1(cropInput, { objectFit: options?.objectFit });
  const rect = crop.rectNorm;
  const centerX = Math.max(rect.x, Math.min(rect.x + rect.w, crop.panNorm.x));
  const centerY = Math.max(rect.y, Math.min(rect.y + rect.h, crop.panNorm.y));
  const xPct = Math.round(centerX * 100);
  const yPct = Math.round(centerY * 100);
  const rectScale =
    crop.objectFit === "cover"
      ? 1 / Math.max(0.01, Math.min(rect.w, rect.h))
      : 1 / Math.max(0.01, Math.max(rect.w, rect.h));
  const zoom = Math.max(1, crop.zoom * rectScale);
  const rotation = crop.rotationDeg;

  return {
    crop,
    objectFit: crop.objectFit,
    style: {
      objectPosition: `${xPct}% ${yPct}%`,
      transform: `scale(${zoom}) rotate(${rotation}deg)`,
      transformOrigin: "center"
    } as const
  };
}
