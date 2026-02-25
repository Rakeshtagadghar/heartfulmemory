import type { ResizeHandle, Rect } from "./resizeImage";

export function resizeShapeRect(options: {
  start: Rect;
  dx: number;
  dy: number;
  handle: ResizeHandle;
  minSize?: number;
}) {
  const minSize = Math.max(16, options.minSize ?? 24);
  const { start, dx, dy, handle } = options;
  let x = start.x;
  let y = start.y;
  let w = start.w;
  let h = start.h;

  if (handle.includes("e")) w = Math.max(minSize, start.w + dx);
  if (handle.includes("s")) h = Math.max(minSize, start.h + dy);
  if (handle.includes("w")) {
    const nextW = Math.max(minSize, start.w - dx);
    x = start.x + (start.w - nextW);
    w = nextW;
  }
  if (handle.includes("n")) {
    const nextH = Math.max(minSize, start.h - dy);
    y = start.y + (start.h - nextH);
    h = nextH;
  }

  return { x, y, w, h };
}

