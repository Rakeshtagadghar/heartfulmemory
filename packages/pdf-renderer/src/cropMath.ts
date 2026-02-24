export type CropRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type FocalPoint = {
  x: number;
  y: number;
};

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function normalizeCrop(input?: Partial<CropRect> | null): CropRect {
  if (!input) return { x: 0, y: 0, w: 1, h: 1 };
  const x = clamp01(input.x ?? 0);
  const y = clamp01(input.y ?? 0);
  const w = Math.max(0.05, Math.min(1 - x, input.w ?? 1));
  const h = Math.max(0.05, Math.min(1 - y, input.h ?? 1));
  return { x, y, w, h };
}

export function focalPointToObjectPosition(focal?: Partial<FocalPoint> | null) {
  const x = clamp01(focal?.x ?? 0.5);
  const y = clamp01(focal?.y ?? 0.5);
  return `${Math.round(x * 100)}% ${Math.round(y * 100)}%`;
}

