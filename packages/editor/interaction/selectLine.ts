import type { Rect } from "./resizeImage";

export function buildLineSelectionBounds(frame: Rect, padding = 8): Rect {
  return {
    x: frame.x - padding,
    y: frame.y - padding,
    w: frame.w + padding * 2,
    h: frame.h + padding * 2
  };
}

export function isPointNearLineSelection(frame: Rect, point: { x: number; y: number }, padding = 8) {
  const bounds = buildLineSelectionBounds(frame, padding);
  return (
    point.x >= bounds.x &&
    point.y >= bounds.y &&
    point.x <= bounds.x + bounds.w &&
    point.y <= bounds.y + bounds.h
  );
}

