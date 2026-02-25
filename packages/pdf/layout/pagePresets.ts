export const PDF_PX_DPI = 96;
export const PDF_PT_PER_INCH = 72;
export const PX_TO_PT = PDF_PT_PER_INCH / PDF_PX_DPI;

export type PdfPagePresetName = "A4" | "US_LETTER" | "BOOK_6X9" | "BOOK_8_5X11";
export type ExportModeV1 = "digital" | "hardcopy";

export type PagePresetV1 = {
  name: PdfPagePresetName;
  widthIn: number;
  heightIn: number;
  defaultMarginsPx: { top: number; right: number; bottom: number; left: number };
  bleedPx: number;
  safePaddingPx: number;
};

export const PAGE_PRESETS_V1: Record<PdfPagePresetName, PagePresetV1> = {
  A4: { name: "A4", widthIn: 8.27, heightIn: 11.69, defaultMarginsPx: { top: 48, right: 48, bottom: 48, left: 48 }, bleedPx: 18, safePaddingPx: 18 },
  US_LETTER: { name: "US_LETTER", widthIn: 8.5, heightIn: 11, defaultMarginsPx: { top: 48, right: 48, bottom: 48, left: 48 }, bleedPx: 18, safePaddingPx: 18 },
  BOOK_6X9: { name: "BOOK_6X9", widthIn: 6, heightIn: 9, defaultMarginsPx: { top: 36, right: 36, bottom: 42, left: 36 }, bleedPx: 18, safePaddingPx: 18 },
  BOOK_8_5X11: { name: "BOOK_8_5X11", widthIn: 8.5, heightIn: 11, defaultMarginsPx: { top: 40, right: 40, bottom: 44, left: 40 }, bleedPx: 18, safePaddingPx: 18 }
};

export type PageBoxModelV1 = {
  pageWidthPx: number;
  pageHeightPx: number;
  trimBox: { x: number; y: number; w: number; h: number };
  bleedBox: { x: number; y: number; w: number; h: number };
  safeBox: { x: number; y: number; w: number; h: number };
};

export function pxToPt(px: number) {
  return px * PX_TO_PT;
}

export function getPagePresetV1(name: PdfPagePresetName) {
  return PAGE_PRESETS_V1[name];
}

export function buildPageBoxModelV1(input: {
  preset: PdfPagePresetName;
  pageWidthPx: number;
  pageHeightPx: number;
  marginsPx: { top: number; right: number; bottom: number; left: number };
  exportMode: ExportModeV1;
}) : PageBoxModelV1 {
  const preset = getPagePresetV1(input.preset);
  const bleed = input.exportMode === "hardcopy" ? preset.bleedPx : 0;
  const safePadding = input.exportMode === "hardcopy" ? preset.safePaddingPx : 0;
  const trimBox = { x: 0, y: 0, w: input.pageWidthPx, h: input.pageHeightPx };
  const bleedBox = { x: -bleed, y: -bleed, w: input.pageWidthPx + bleed * 2, h: input.pageHeightPx + bleed * 2 };
  const safeBox = {
    x: input.marginsPx.left + safePadding,
    y: input.marginsPx.top + safePadding,
    w: Math.max(0, input.pageWidthPx - input.marginsPx.left - input.marginsPx.right - safePadding * 2),
    h: Math.max(0, input.pageHeightPx - input.marginsPx.top - input.marginsPx.bottom - safePadding * 2)
  };
  return {
    pageWidthPx: input.pageWidthPx,
    pageHeightPx: input.pageHeightPx,
    trimBox,
    bleedBox,
    safeBox
  };
}

