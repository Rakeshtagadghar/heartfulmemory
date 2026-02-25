import { PX_TO_PT } from "./pagePresets";

export function pxToPt(px: number) {
  return px * PX_TO_PT;
}

export function ptToPx(pt: number) {
  return pt / PX_TO_PT;
}

export function canvasYToPdfY(input: { yPx: number; heightPx: number; pageHeightPx: number }) {
  return input.pageHeightPx - (input.yPx + input.heightPx);
}

export function rectPxToPdfPt(input: { x: number; y: number; w: number; h: number; pageHeightPx: number }) {
  return {
    x: pxToPt(input.x),
    y: pxToPt(canvasYToPdfY({ yPx: input.y, heightPx: input.h, pageHeightPx: input.pageHeightPx })),
    width: pxToPt(input.w),
    height: pxToPt(input.h)
  };
}

