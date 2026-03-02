import { describe, expect, it } from "vitest";
import {
  applyOrientation,
  type PageWithFrames
} from "../../../../packages/editor/orientation/applyOrientation";

function makePage(overrides: Partial<PageWithFrames> = {}): PageWithFrames {
  return {
    id: "page-1",
    widthPx: 816,
    heightPx: 1056,
    margins: { top: 44, right: 44, bottom: 44, left: 44 },
    frames: [],
    ...overrides
  };
}

describe("applyOrientation", () => {
  it("swaps page dimensions from portrait to landscape", () => {
    const pages = [makePage()];
    const [patch] = applyOrientation(pages, "landscape");
    expect(patch.widthPx).toBe(1056);
    expect(patch.heightPx).toBe(816);
  });

  it("no-op when already in target orientation", () => {
    const pages = [makePage({ widthPx: 1056, heightPx: 816 })];
    const [patch] = applyOrientation(pages, "landscape");
    expect(patch.widthPx).toBe(1056);
    expect(patch.heightPx).toBe(816);
  });

  it("clamps frame that overflows new safe area", () => {
    const pages = [
      makePage({
        frames: [{ id: "f1", x: 44, y: 44, w: 700, h: 900 }]
      })
    ];
    const [patch] = applyOrientation(pages, "landscape");
    // New safe area: x=44, y=44, w=1056-88=968, h=816-88=728
    const fp = patch.framePatch[0];
    expect(fp.w).toBeLessThanOrEqual(968);
    expect(fp.h).toBeLessThanOrEqual(728);
    expect(fp.x).toBeGreaterThanOrEqual(44);
    expect(fp.y).toBeGreaterThanOrEqual(44);
  });

  it("keeps frame inside safe area when it already fits", () => {
    const pages = [
      makePage({
        frames: [{ id: "f1", x: 100, y: 100, w: 200, h: 200 }]
      })
    ];
    const [patch] = applyOrientation(pages, "landscape");
    const fp = patch.framePatch[0];
    expect(fp.x).toBe(100);
    expect(fp.y).toBe(100);
    expect(fp.w).toBe(200);
    expect(fp.h).toBe(200);
  });

  it("clamps frame position when it extends past safe area boundary", () => {
    // Frame positioned near bottom-right in portrait, should shift up in landscape
    const pages = [
      makePage({
        frames: [{ id: "f1", x: 600, y: 900, w: 200, h: 100 }]
      })
    ];
    const [patch] = applyOrientation(pages, "landscape");
    const fp = patch.framePatch[0];
    const safeRight = 44 + 968; // 1012
    const safeBottom = 44 + 728; // 772
    expect(fp.x + fp.w).toBeLessThanOrEqual(safeRight);
    expect(fp.y + fp.h).toBeLessThanOrEqual(safeBottom);
  });

  it("handles multiple pages", () => {
    const pages = [
      makePage({ id: "p1" }),
      makePage({ id: "p2", frames: [{ id: "f2", x: 50, y: 50, w: 100, h: 100 }] })
    ];
    const patches = applyOrientation(pages, "landscape");
    expect(patches).toHaveLength(2);
    expect(patches[0].pageId).toBe("p1");
    expect(patches[1].pageId).toBe("p2");
    expect(patches[1].framePatch).toHaveLength(1);
  });

  it("is reversible: portrait -> landscape -> portrait restores dimensions", () => {
    const pages = [makePage()];
    const [landscapePatch] = applyOrientation(pages, "landscape");
    const landscapePage = makePage({
      widthPx: landscapePatch.widthPx,
      heightPx: landscapePatch.heightPx
    });
    const [portraitPatch] = applyOrientation([landscapePage], "portrait");
    expect(portraitPatch.widthPx).toBe(816);
    expect(portraitPatch.heightPx).toBe(1056);
  });
});
