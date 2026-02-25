import { computeInsertedImagePlacement } from "../../../../packages/editor/commands/insertImage";

describe("computeInsertedImagePlacement", () => {
  it("fits image within max box while preserving aspect ratio", () => {
    const result = computeInsertedImagePlacement({
      pageWidth: 1000,
      pageHeight: 800,
      intrinsicWidth: 2000,
      intrinsicHeight: 1000
    });

    expect(result.w).toBeLessThanOrEqual(400);
    expect(result.h).toBeLessThanOrEqual(320);
    expect(Math.round((result.w / result.h) * 100)).toBe(200);
  });

  it("centers image on page", () => {
    const result = computeInsertedImagePlacement({
      pageWidth: 600,
      pageHeight: 900,
      intrinsicWidth: 300,
      intrinsicHeight: 300
    });

    expect(result.x).toBe(Math.round((600 - result.w) / 2));
    expect(result.y).toBe(Math.round((900 - result.h) / 2));
  });
});
