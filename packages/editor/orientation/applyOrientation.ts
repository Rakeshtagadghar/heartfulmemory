import { applyOrientationReflowV2 } from "./applyOrientationReflowV2";

export type OrientationType = "portrait" | "landscape";

export type FrameInput = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PageWithFrames = {
  id: string;
  widthPx: number;
  heightPx: number;
  margins: { top: number; right: number; bottom: number; left: number };
  frames: FrameInput[];
};

export type FrameClampPatch = {
  frameId: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type OrientationPatch = {
  pageId: string;
  widthPx: number;
  heightPx: number;
  framePatch: FrameClampPatch[];
};

/**
 * Computes page dimension changes and frame reflow patches when switching orientation.
 *
 * V2 engine: Wide nodes (>= 60% of safe area width) preserve their relative
 * width percentage. Fixed nodes keep absolute size, map position proportionally.
 * All nodes are clamped to stay inside the safe area.
 */
export function applyOrientation(
  pages: PageWithFrames[],
  newOrientation: OrientationType
): OrientationPatch[] {
  return applyOrientationReflowV2(pages, newOrientation);
}
