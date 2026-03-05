/**
 * Coordinate transforms from Studio pixels (96 DPI) to PowerPoint inches.
 */

const PX_PER_INCH = 96;

export function pxToInches(px: number): number {
  return px / PX_PER_INCH;
}

export type PptxRect = {
  x: number; // inches
  y: number;
  w: number;
  h: number;
};

export function frameToPptxRect(frame: {
  x: number;
  y: number;
  w: number;
  h: number;
}): PptxRect {
  return {
    x: pxToInches(frame.x),
    y: pxToInches(frame.y),
    w: pxToInches(frame.w),
    h: pxToInches(frame.h),
  };
}

export function pageSizeToInches(page: {
  widthPx: number;
  heightPx: number;
}): { width: number; height: number } {
  return {
    width: pxToInches(page.widthPx),
    height: pxToInches(page.heightPx),
  };
}
