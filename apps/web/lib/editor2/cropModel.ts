export type CropState = {
  focalX: number;
  focalY: number;
  scale: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeCrop(input: Partial<CropState> | null | undefined): CropState {
  return {
    focalX: clamp(typeof input?.focalX === "number" ? input.focalX : 0.5, 0, 1),
    focalY: clamp(typeof input?.focalY === "number" ? input.focalY : 0.5, 0, 1),
    scale: clamp(typeof input?.scale === "number" ? input.scale : 1, 0.5, 3)
  };
}

export function panCropByDelta(
  current: Partial<CropState> | null | undefined,
  input: { dxPx: number; dyPx: number; frameWidthPx: number; frameHeightPx: number }
): CropState {
  const base = normalizeCrop(current);
  const nextX = base.focalX - input.dxPx / Math.max(1, input.frameWidthPx * base.scale);
  const nextY = base.focalY - input.dyPx / Math.max(1, input.frameHeightPx * base.scale);
  return {
    ...base,
    focalX: clamp(nextX, 0, 1),
    focalY: clamp(nextY, 0, 1)
  };
}
