import { resizeImageWithAspect } from "../../../../packages/editor/interaction/resizeImage";

describe("resizeImageWithAspect", () => {
  it("preserves aspect ratio on corner resize", () => {
    const result = resizeImageWithAspect({
      start: { x: 100, y: 100, w: 400, h: 200 },
      dx: 80,
      dy: 20,
      handle: "se"
    });

    expect(Math.round((result.w / result.h) * 100)).toBe(200);
    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
  });

  it("keeps image centered on opposite axis for edge resize", () => {
    const result = resizeImageWithAspect({
      start: { x: 100, y: 100, w: 300, h: 150 },
      dx: 60,
      dy: 0,
      handle: "e"
    });

    expect(Math.round((result.w / result.h) * 100)).toBe(200);
    expect(result.y).not.toBe(100);
  });
});
