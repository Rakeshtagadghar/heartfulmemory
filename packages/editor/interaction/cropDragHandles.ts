import { normalizeCropModelV1, type CropModelV1, type CropRectNorm } from "../models/cropModel";

export type CropHandle =
  | "n"
  | "s"
  | "e"
  | "w"
  | "nw"
  | "ne"
  | "sw"
  | "se";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampRect(rect: CropRectNorm, minSize = 0.05): CropRectNorm {
  const w = clamp(rect.w, minSize, 1);
  const h = clamp(rect.h, minSize, 1);
  const x = clamp(rect.x, 0, 1 - w);
  const y = clamp(rect.y, 0, 1 - h);
  return { x, y, w, h };
}

export function resizeCropRectByHandle(
  cropInput: CropModelV1 | Record<string, unknown> | null | undefined,
  input: {
    handle: CropHandle;
    dxPx: number;
    dyPx: number;
    frameWidthPx: number;
    frameHeightPx: number;
    minSizeNorm?: number;
  }
): CropModelV1 {
  const crop = normalizeCropModelV1(cropInput as Record<string, unknown> | null | undefined);
  const minSize = input.minSizeNorm ?? 0.05;
  const dx = input.dxPx / Math.max(1, input.frameWidthPx);
  const dy = input.dyPx / Math.max(1, input.frameHeightPx);
  const rect = { ...crop.rectNorm };

  const moveLeft = input.handle.includes("w");
  const moveRight = input.handle.includes("e");
  const moveTop = input.handle.includes("n");
  const moveBottom = input.handle.includes("s");

  let x1 = rect.x;
  let y1 = rect.y;
  let x2 = rect.x + rect.w;
  let y2 = rect.y + rect.h;

  if (moveLeft) x1 += dx;
  if (moveRight) x2 += dx;
  if (moveTop) y1 += dy;
  if (moveBottom) y2 += dy;

  if (x2 - x1 < minSize) {
    if (moveLeft) x1 = x2 - minSize;
    if (moveRight) x2 = x1 + minSize;
  }
  if (y2 - y1 < minSize) {
    if (moveTop) y1 = y2 - minSize;
    if (moveBottom) y2 = y1 + minSize;
  }

  const nextRect = clampRect({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, minSize);

  const centerX = nextRect.x + nextRect.w / 2;
  const centerY = nextRect.y + nextRect.h / 2;

  return {
    ...crop,
    enabled: true,
    rectNorm: nextRect,
    panNorm: crop.mode === "frame"
      ? {
          x: clamp(crop.panNorm.x, nextRect.x, nextRect.x + nextRect.w),
          y: clamp(crop.panNorm.y, nextRect.y, nextRect.y + nextRect.h)
        }
      : {
          x: clamp(crop.panNorm.x ?? centerX, 0, 1),
          y: clamp(crop.panNorm.y ?? centerY, 0, 1)
        }
  };
}
