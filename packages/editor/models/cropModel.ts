export type CropObjectFit = "cover" | "contain";
export type CropModeKind = "free" | "frame";

export type CropRectNorm = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type CropPanNorm = {
  x: number;
  y: number;
};

export type CropModelV1 = {
  enabled: boolean;
  mode: CropModeKind;
  rectNorm: CropRectNorm;
  panNorm: CropPanNorm;
  zoom: number;
  rotationDeg: number;
  objectFit: CropObjectFit;
};

export const DEFAULT_CROP_MODEL_V1: CropModelV1 = {
  enabled: false,
  mode: "free",
  rectNorm: { x: 0, y: 0, w: 1, h: 1 },
  panNorm: { x: 0.5, y: 0.5 },
  zoom: 1,
  rotationDeg: 0,
  objectFit: "cover"
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeRectNorm(input: unknown): CropRectNorm {
  const raw = input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
  const x = clamp(typeof raw.x === "number" ? raw.x : 0, 0, 1);
  const y = clamp(typeof raw.y === "number" ? raw.y : 0, 0, 1);
  const w = clamp(typeof raw.w === "number" ? raw.w : 1, 0.01, 1);
  const h = clamp(typeof raw.h === "number" ? raw.h : 1, 0.01, 1);
  return {
    x: clamp(x, 0, 1 - w),
    y: clamp(y, 0, 1 - h),
    w,
    h
  };
}

function normalizePanNorm(input: unknown): CropPanNorm {
  const raw = input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
  return {
    x: clamp(typeof raw.x === "number" ? raw.x : 0.5, 0, 1),
    y: clamp(typeof raw.y === "number" ? raw.y : 0.5, 0, 1)
  };
}

function normalizeRotationDeg(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

export function normalizeCropModelV1(
  input: Record<string, unknown> | null | undefined,
  options?: Partial<Pick<CropModelV1, "mode" | "objectFit">>
): CropModelV1 {
  const raw = input ?? {};

  // Backward compatibility with legacy `{ focalX, focalY, scale }`.
  const hasLegacy = "focalX" in raw || "focalY" in raw || "scale" in raw;
  const legacyPan = hasLegacy
    ? {
        x: typeof raw.focalX === "number" ? raw.focalX : 0.5,
        y: typeof raw.focalY === "number" ? raw.focalY : 0.5
      }
    : null;

  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : Boolean(input),
    mode: raw.mode === "frame" || raw.mode === "free" ? raw.mode : (options?.mode ?? "free"),
    rectNorm: normalizeRectNorm(raw.rectNorm),
    panNorm: normalizePanNorm(raw.panNorm ?? legacyPan),
    zoom: clamp(typeof raw.zoom === "number" ? raw.zoom : typeof raw.scale === "number" ? raw.scale : 1, 1, 5),
    rotationDeg: normalizeRotationDeg(raw.rotationDeg),
    objectFit:
      raw.objectFit === "contain" || raw.objectFit === "cover"
        ? raw.objectFit
        : (options?.objectFit ?? "cover")
  };
}

export function serializeCropModelV1(model: CropModelV1): Record<string, unknown> {
  const normalized = normalizeCropModelV1(model as unknown as Record<string, unknown>, {
    mode: model.mode,
    objectFit: model.objectFit
  });
  return {
    ...normalized,
    // Compatibility fields for existing code paths that still read them.
    focalX: normalized.panNorm.x,
    focalY: normalized.panNorm.y,
    scale: normalized.zoom
  };
}

export function resetCropModelV1(input: Record<string, unknown> | null | undefined, mode: CropModeKind): CropModelV1 {
  return normalizeCropModelV1(
    {
      ...DEFAULT_CROP_MODEL_V1,
      enabled: true,
      mode,
      objectFit: mode === "frame" ? "cover" : "contain"
    },
    { mode, objectFit: mode === "frame" ? "cover" : "contain" }
  );
}

export function updateCropZoomV1(current: Record<string, unknown> | CropModelV1 | null | undefined, zoom: number) {
  const base = normalizeCropModelV1(current as Record<string, unknown> | null | undefined);
  return {
    ...base,
    enabled: true,
    zoom: clamp(zoom, 1, 5)
  };
}

export function updateCropRotationV1(
  current: Record<string, unknown> | CropModelV1 | null | undefined,
  rotationDeg: number
) {
  const base = normalizeCropModelV1(current as Record<string, unknown> | null | undefined);
  return {
    ...base,
    enabled: true,
    rotationDeg: normalizeRotationDeg(rotationDeg)
  };
}

export function panCropByDeltaV1(
  current: Record<string, unknown> | CropModelV1 | null | undefined,
  input: { dxPx: number; dyPx: number; frameWidthPx: number; frameHeightPx: number }
): CropModelV1 {
  const base = normalizeCropModelV1(current as Record<string, unknown> | null | undefined);
  const nextX = base.panNorm.x - input.dxPx / Math.max(1, input.frameWidthPx * base.zoom);
  const nextY = base.panNorm.y - input.dyPx / Math.max(1, input.frameHeightPx * base.zoom);
  return {
    ...base,
    enabled: true,
    panNorm: {
      x: clamp(nextX, 0, 1),
      y: clamp(nextY, 0, 1)
    }
  };
}

