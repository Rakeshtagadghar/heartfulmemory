import { describe, expect, it } from "vitest";
import type PptxGenJS from "pptxgenjs";
import { addFrameToSlide, type StudioFrame } from "../../lib/export/pptx/nodeMappers";

function makeFrame(overrides: Partial<StudioFrame>): StudioFrame {
  return {
    id: "frame-1",
    type: "TEXT",
    x: 96,
    y: 96,
    w: 480,
    h: 288,
    zIndex: 0,
    style: {},
    content: {},
    crop: null,
    ...overrides,
  };
}

// Mock slide that records calls
function createMockSlide() {
  const calls: { method: string; args: unknown[] }[] = [];
  const slideLike = {
    calls,
    addText: (...args: unknown[]) => calls.push({ method: "addText", args }),
    addImage: (...args: unknown[]) => calls.push({ method: "addImage", args }),
    addShape: (...args: unknown[]) => calls.push({ method: "addShape", args }),
  };
  return slideLike as typeof slideLike & PptxGenJS.Slide;
}

describe("nodeMappers", () => {
  describe("addFrameToSlide", () => {
    it("adds text box for TEXT frame", () => {
      const slide = createMockSlide();
      const frame = makeFrame({
        type: "TEXT",
        content: { text: "Hello world" },
        style: { fontSize: "16", fontFamily: "Arial", color: "#333333" },
      });
      const warning = addFrameToSlide(slide, frame, new Map());
      expect(warning).toBeNull();
      expect(slide.calls).toHaveLength(1);
      expect(slide.calls[0].method).toBe("addText");
    });

    it("skips TEXT frame with empty content", () => {
      const slide = createMockSlide();
      const frame = makeFrame({ type: "TEXT", content: {} });
      addFrameToSlide(slide, frame, new Map());
      expect(slide.calls).toHaveLength(0);
    });

    it("adds image for IMAGE frame with resolved data", () => {
      const slide = createMockSlide();
      const frame = makeFrame({
        type: "IMAGE",
        content: { assetId: "asset-1" },
      });
      const resolved = new Map([
        [
          "frame-1",
          {
            frameId: "frame-1",
            buffer: Buffer.from("fake-image"),
            mimeType: "image/png",
          },
        ],
      ]);
      const warning = addFrameToSlide(slide, frame, resolved);
      expect(warning).toBeNull();
      expect(slide.calls).toHaveLength(1);
      expect(slide.calls[0].method).toBe("addImage");
    });

    it("returns warning for IMAGE frame without resolved data", () => {
      const slide = createMockSlide();
      const frame = makeFrame({ type: "IMAGE" });
      const warning = addFrameToSlide(slide, frame, new Map());
      expect(warning).not.toBeNull();
      expect(warning!.message).toContain("not found");
    });

    it("adds shape for SHAPE frame", () => {
      const slide = createMockSlide();
      const frame = makeFrame({
        type: "SHAPE",
        style: { backgroundColor: "#FF0000" },
      });
      const warning = addFrameToSlide(slide, frame, new Map());
      expect(warning).toBeNull();
      expect(slide.calls).toHaveLength(1);
      expect(slide.calls[0].method).toBe("addShape");
    });

    it("adds line for LINE frame", () => {
      const slide = createMockSlide();
      const frame = makeFrame({ type: "LINE" });
      const warning = addFrameToSlide(slide, frame, new Map());
      expect(warning).toBeNull();
      expect(slide.calls).toHaveLength(1);
      expect(slide.calls[0].method).toBe("addShape");
    });

    it("returns warning for GROUP frame", () => {
      const slide = createMockSlide();
      const frame = makeFrame({ type: "GROUP" });
      const warning = addFrameToSlide(slide, frame, new Map());
      expect(warning).not.toBeNull();
      expect(warning!.message).toContain("GROUP");
    });

    it("renders FRAME type as rectangle", () => {
      const slide = createMockSlide();
      const frame = makeFrame({ type: "FRAME" });
      const warning = addFrameToSlide(slide, frame, new Map());
      expect(warning).toBeNull();
      expect(slide.calls[0].method).toBe("addShape");
    });

    it("renders FRAME with imageRef as image when resolved data exists", () => {
      const slide = createMockSlide();
      const frame = makeFrame({
        type: "FRAME",
        content: { imageRef: { assetId: "asset-2", sourceUrl: "https://example.com/test.jpg" } },
      });
      const resolved = new Map([
        [
          "frame-1",
          {
            frameId: "frame-1",
            buffer: Buffer.from("fake-image"),
            mimeType: "image/jpeg",
          },
        ],
      ]);
      const warning = addFrameToSlide(slide, frame, resolved);
      expect(warning).toBeNull();
      expect(slide.calls).toHaveLength(1);
      expect(slide.calls[0].method).toBe("addImage");
    });

    it("warns for FRAME with imageRef when resolved data is missing", () => {
      const slide = createMockSlide();
      const frame = makeFrame({
        type: "FRAME",
        content: { imageRef: { assetId: "asset-2" } },
      });
      const warning = addFrameToSlide(slide, frame, new Map());
      expect(warning).not.toBeNull();
      expect(warning!.message).toContain("Frame image asset not found");
      expect(slide.calls).toHaveLength(1);
      expect(slide.calls[0].method).toBe("addShape");
    });
  });
});
