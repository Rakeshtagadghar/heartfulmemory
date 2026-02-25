export type InsertImagePlacementInput = {
  pageWidth: number;
  pageHeight: number;
  intrinsicWidth?: number | null;
  intrinsicHeight?: number | null;
  maxPageWidthRatio?: number;
  maxPageHeightRatio?: number;
  minSizePx?: number;
};

export type InsertImagePlacement = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export function computeInsertedImagePlacement(input: InsertImagePlacementInput): InsertImagePlacement {
  const maxWidth = Math.max(24, Math.floor(input.pageWidth * (input.maxPageWidthRatio ?? 0.4)));
  const maxHeight = Math.max(24, Math.floor(input.pageHeight * (input.maxPageHeightRatio ?? 0.4)));
  const minSize = Math.max(24, input.minSizePx ?? 48);

  const intrinsicW = input.intrinsicWidth && input.intrinsicWidth > 0 ? input.intrinsicWidth : 1200;
  const intrinsicH = input.intrinsicHeight && input.intrinsicHeight > 0 ? input.intrinsicHeight : 900;

  const scale = Math.min(maxWidth / intrinsicW, maxHeight / intrinsicH, 1);
  const fittedW = Math.max(minSize, Math.round(intrinsicW * scale));
  const fittedH = Math.max(minSize, Math.round(intrinsicH * scale));
  const w = Math.min(fittedW, input.pageWidth);
  const h = Math.min(fittedH, input.pageHeight);

  return {
    x: Math.max(0, Math.round((input.pageWidth - w) / 2)),
    y: Math.max(0, Math.round((input.pageHeight - h) / 2)),
    w,
    h
  };
}
