import { describe, expect, it } from "vitest";
import {
  getPresetDimensionsPx,
  PORTRAIT_PRESET_PX,
  type PdfPagePresetName
} from "../../../../packages/pdf/layout/pagePresets";

describe("getPresetDimensionsPx", () => {
  it("returns portrait dimensions unchanged", () => {
    const result = getPresetDimensionsPx("BOOK_8_5X11", "portrait");
    expect(result).toEqual({ widthPx: 816, heightPx: 1056 });
  });

  it("swaps width and height for landscape", () => {
    const result = getPresetDimensionsPx("BOOK_8_5X11", "landscape");
    expect(result).toEqual({ widthPx: 1056, heightPx: 816 });
  });

  it("landscape width is greater than height for all presets", () => {
    const presets: PdfPagePresetName[] = ["A4", "US_LETTER", "BOOK_6X9", "BOOK_8_5X11"];
    for (const preset of presets) {
      const { widthPx, heightPx } = getPresetDimensionsPx(preset, "landscape");
      expect(widthPx).toBeGreaterThan(heightPx);
    }
  });

  it("portrait height is greater than width for all presets", () => {
    const presets: PdfPagePresetName[] = ["A4", "US_LETTER", "BOOK_6X9", "BOOK_8_5X11"];
    for (const preset of presets) {
      const { widthPx, heightPx } = getPresetDimensionsPx(preset, "portrait");
      expect(heightPx).toBeGreaterThan(widthPx);
    }
  });

  it("A4 portrait matches known pixel dimensions", () => {
    const result = getPresetDimensionsPx("A4", "portrait");
    expect(result).toEqual(PORTRAIT_PRESET_PX.A4);
  });

  it("landscape then portrait round-trips to original dimensions", () => {
    const portrait = getPresetDimensionsPx("BOOK_6X9", "portrait");
    const landscape = getPresetDimensionsPx("BOOK_6X9", "landscape");
    expect(landscape.widthPx).toBe(portrait.heightPx);
    expect(landscape.heightPx).toBe(portrait.widthPx);
  });
});
