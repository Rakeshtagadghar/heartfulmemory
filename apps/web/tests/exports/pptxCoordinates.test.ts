import { describe, expect, it } from "vitest";
import {
  pxToInches,
  frameToPptxRect,
  pageSizeToInches,
} from "../../lib/export/pptx/coordinateMap";
import { filterVisiblePages } from "../../lib/export/pptx/generatePptx";

describe("PPTX coordinate mapping", () => {
  describe("pxToInches", () => {
    it("converts 96px to 1 inch", () => {
      expect(pxToInches(96)).toBe(1);
    });

    it("converts 0px to 0 inches", () => {
      expect(pxToInches(0)).toBe(0);
    });

    it("converts 48px to 0.5 inches", () => {
      expect(pxToInches(48)).toBe(0.5);
    });

    it("handles fractional pixels", () => {
      expect(pxToInches(72)).toBeCloseTo(0.75, 5);
    });
  });

  describe("frameToPptxRect", () => {
    it("converts frame position and size to inches", () => {
      const rect = frameToPptxRect({ x: 96, y: 192, w: 480, h: 288 });
      expect(rect).toEqual({
        x: 1,
        y: 2,
        w: 5,
        h: 3,
      });
    });

    it("handles zero-sized frame", () => {
      const rect = frameToPptxRect({ x: 0, y: 0, w: 0, h: 0 });
      expect(rect).toEqual({ x: 0, y: 0, w: 0, h: 0 });
    });
  });

  describe("pageSizeToInches", () => {
    it("converts portrait A4 page dimensions", () => {
      const size = pageSizeToInches({ widthPx: 794, heightPx: 1123 });
      expect(size.width).toBeCloseTo(8.27, 1);
      expect(size.height).toBeCloseTo(11.70, 1);
    });

    it("converts landscape A4 page dimensions", () => {
      const size = pageSizeToInches({ widthPx: 1123, heightPx: 794 });
      expect(size.width).toBeCloseTo(11.70, 1);
      expect(size.height).toBeCloseTo(8.27, 1);
    });

    it("converts portrait US Letter page dimensions", () => {
      const size = pageSizeToInches({ widthPx: 816, heightPx: 1056 });
      expect(size.width).toBe(8.5);
      expect(size.height).toBe(11);
    });

    it("converts landscape US Letter page dimensions", () => {
      const size = pageSizeToInches({ widthPx: 1056, heightPx: 816 });
      expect(size.width).toBe(11);
      expect(size.height).toBe(8.5);
    });
  });

  describe("filterVisiblePages", () => {
    it("excludes hidden pages", () => {
      const pages = [
        { id: "p1", isHidden: false },
        { id: "p2", isHidden: true },
        { id: "p3", isHidden: false },
      ];
      const visible = filterVisiblePages(pages);
      expect(visible.map((p) => p.id)).toEqual(["p1", "p3"]);
    });

    it("treats undefined isHidden as visible", () => {
      const pages = [
        { id: "p1" },
        { id: "p2", isHidden: undefined },
      ];
      const visible = filterVisiblePages(pages);
      expect(visible).toHaveLength(2);
    });

    it("returns empty array when all pages hidden", () => {
      const pages = [
        { id: "p1", isHidden: true },
        { id: "p2", isHidden: true },
      ];
      const visible = filterVisiblePages(pages);
      expect(visible).toEqual([]);
    });
  });
});
