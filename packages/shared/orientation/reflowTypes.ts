/** Safe area rectangle within a page (printable area inside margins). */
export type SafeBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Rect expressed as fractions (0–1) relative to a SafeBox. */
export type RelativeRect = {
  rx: number;
  ry: number;
  rw: number;
  rh: number;
};

/** Node classification for reflow behavior. */
export type ReflowClassification = "wide" | "fixed";

/**
 * Threshold: a node whose width is >= 60% of the safe area width
 * is classified as "wide" and will preserve its relative width
 * across orientation switches.
 */
export const WIDE_NODE_THRESHOLD = 0.60;
