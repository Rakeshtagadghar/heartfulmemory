import type { ResizeHandle, Rect } from "./resizeImage";
import { resizeShapeRect } from "./resizeShape";

export function resizeFrameRect(options: {
  start: Rect;
  dx: number;
  dy: number;
  handle: ResizeHandle;
  minSize?: number;
  preserveAspect?: boolean;
}) {
  const next = resizeShapeRect(options);
  if (!options.preserveAspect) return next;

  const ratio = Math.max(0.01, options.start.w / Math.max(1, options.start.h));
  const targetW = next.w;
  const targetH = Math.max(options.minSize ?? 24, Math.round(targetW / ratio));
  const y = options.handle.includes("n")
    ? options.start.y + (options.start.h - targetH)
    : next.y;
  return { ...next, h: targetH, y };
}

