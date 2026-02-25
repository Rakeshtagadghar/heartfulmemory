import type { ResizeHandle, Rect } from "./resizeImage";
import { resizeShapeRect } from "./resizeShape";

export function resizeGroupRect(options: {
  start: Rect;
  dx: number;
  dy: number;
  handle: ResizeHandle;
  minSize?: number;
}) {
  return resizeShapeRect(options);
}

