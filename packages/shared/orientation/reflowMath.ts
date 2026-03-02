import type { SafeBox, RelativeRect, ReflowClassification } from "./reflowTypes";
import { WIDE_NODE_THRESHOLD } from "./reflowTypes";

type Margins = { top: number; right: number; bottom: number; left: number };
type Rect = { x: number; y: number; w: number; h: number };

/**
 * Compute the printable safe area box from page dimensions and margins.
 */
export function computeSafeBox(pageW: number, pageH: number, margins: Margins): SafeBox {
  return {
    x: margins.left,
    y: margins.top,
    w: Math.max(0, pageW - margins.left - margins.right),
    h: Math.max(0, pageH - margins.top - margins.bottom),
  };
}

/**
 * Convert an absolute rect to relative coordinates (0–1 fractions of the safe box).
 */
export function toRelativeRect(rect: Rect, safeBox: SafeBox): RelativeRect {
  const sw = safeBox.w || 1;
  const sh = safeBox.h || 1;
  return {
    rx: (rect.x - safeBox.x) / sw,
    ry: (rect.y - safeBox.y) / sh,
    rw: rect.w / sw,
    rh: rect.h / sh,
  };
}

/**
 * Convert a relative rect back to absolute coordinates using a new safe box.
 * Rounds to nearest 1px to prevent floating-point drift.
 */
export function fromRelativeRect(rel: RelativeRect, safeBox: SafeBox): Rect {
  return {
    x: Math.round(safeBox.x + rel.rx * safeBox.w),
    y: Math.round(safeBox.y + rel.ry * safeBox.h),
    w: Math.round(rel.rw * safeBox.w),
    h: Math.round(rel.rh * safeBox.h),
  };
}

/**
 * Clamp a rect to fit entirely inside a safe box.
 * Shrinks width/height if necessary, then adjusts position.
 */
export function clampRectToBox(rect: Rect, safeBox: SafeBox): Rect {
  const w = Math.min(rect.w, safeBox.w);
  const h = Math.min(rect.h, safeBox.h);
  const x = Math.max(safeBox.x, Math.min(rect.x, safeBox.x + safeBox.w - w));
  const y = Math.max(safeBox.y, Math.min(rect.y, safeBox.y + safeBox.h - h));
  return { x, y, w, h };
}

/**
 * Classify a node as "wide" or "fixed" based on how much of the safe area width it occupies.
 */
export function classifyNode(nodeW: number, safeBoxW: number): ReflowClassification {
  if (safeBoxW <= 0) return "fixed";
  return (nodeW / safeBoxW) >= WIDE_NODE_THRESHOLD ? "wide" : "fixed";
}
