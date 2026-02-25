import { resizeCropRectByHandle } from "../../../../packages/editor/interaction/cropDragHandles";
import { panCropWithinBounds, updateCropZoomConstrained } from "../../../../packages/editor/interaction/cropPanZoom";

describe("crop interactions", () => {
  it("keeps frame-mode pan inside crop rect bounds", () => {
    const next = panCropWithinBounds(
      {
        enabled: true,
        mode: "frame",
        rectNorm: { x: 0.2, y: 0.2, w: 0.4, h: 0.4 },
        panNorm: { x: 0.21, y: 0.21 },
        zoom: 2,
        rotationDeg: 0,
        objectFit: "cover"
      },
      { dxPx: 1000, dyPx: 1000, frameWidthPx: 200, frameHeightPx: 200 }
    );

    expect(next.panNorm.x).toBeGreaterThanOrEqual(0.2);
    expect(next.panNorm.y).toBeGreaterThanOrEqual(0.2);
    expect(next.panNorm.x).toBeLessThanOrEqual(0.6);
    expect(next.panNorm.y).toBeLessThanOrEqual(0.6);
  });

  it("resizes crop rect with minimum size and keeps it in bounds", () => {
    const next = resizeCropRectByHandle(
      {
        enabled: true,
        mode: "free",
        rectNorm: { x: 0.1, y: 0.1, w: 0.4, h: 0.4 },
        panNorm: { x: 0.5, y: 0.5 },
        zoom: 1,
        rotationDeg: 0,
        objectFit: "contain"
      },
      { handle: "nw", dxPx: -200, dyPx: -200, frameWidthPx: 400, frameHeightPx: 400 }
    );

    expect(next.rectNorm.x).toBeGreaterThanOrEqual(0);
    expect(next.rectNorm.y).toBeGreaterThanOrEqual(0);
    expect(next.rectNorm.w).toBeLessThanOrEqual(1);
    expect(next.rectNorm.h).toBeLessThanOrEqual(1);
    expect(next.rectNorm.w).toBeGreaterThanOrEqual(0.05);
    expect(next.rectNorm.h).toBeGreaterThanOrEqual(0.05);
  });

  it("clamps crop zoom to allowed range", () => {
    const next = updateCropZoomConstrained(null, 99);
    expect(next.zoom).toBe(5);
  });
});
