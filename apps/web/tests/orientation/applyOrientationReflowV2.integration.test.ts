import { describe, expect, it } from "vitest";
import { applyOrientation } from "../../../../packages/editor/orientation/applyOrientation";
import type { PageWithFrames } from "../../../../packages/editor/orientation/applyOrientation";
import { computeSafeBox } from "../../../../packages/shared/orientation/reflowMath";

const margins = { top: 44, right: 44, bottom: 44, left: 44 };

function buildPortraitPage(frames: PageWithFrames["frames"]): PageWithFrames {
  return {
    id: "page-1",
    widthPx: 816,
    heightPx: 1056,
    margins,
    frames,
  };
}

function buildLandscapePage(frames: PageWithFrames["frames"]): PageWithFrames {
  return {
    id: "page-1",
    widthPx: 1056,
    heightPx: 816,
    margins,
    frames,
  };
}

describe("applyOrientationReflowV2 integration", () => {
  it("wide node (80% of safe width) preserves ~80% after portrait→landscape", () => {
    const portraitSafe = computeSafeBox(816, 1056, margins); // w=728
    const wideNodeW = Math.round(portraitSafe.w * 0.8); // 582
    const page = buildPortraitPage([
      { id: "f1", x: 44 + 73, y: 100, w: wideNodeW, h: 200 },
    ]);

    const patches = applyOrientation([page], "landscape");
    expect(patches).toHaveLength(1);

    const landscapeSafe = computeSafeBox(patches[0].widthPx, patches[0].heightPx, margins);
    const fp = patches[0].framePatch[0];

    // Check that relative width is preserved (~80% of new safe width)
    const newRelW = fp.w / landscapeSafe.w;
    expect(newRelW).toBeCloseTo(0.8, 1);
  });

  it("fixed node (30% of safe width) keeps same pixel width", () => {
    const portraitSafe = computeSafeBox(816, 1056, margins);
    const fixedNodeW = Math.round(portraitSafe.w * 0.3); // 218
    const page = buildPortraitPage([
      { id: "f1", x: 100, y: 100, w: fixedNodeW, h: 150 },
    ]);

    const patches = applyOrientation([page], "landscape");
    const fp = patches[0].framePatch[0];

    // Fixed node should keep its pixel width
    expect(fp.w).toBe(fixedNodeW);
  });

  it("landscape→portrait: wide node preserves relative width", () => {
    const landscapeSafe = computeSafeBox(1056, 816, margins); // w=968
    const wideNodeW = Math.round(landscapeSafe.w * 0.75); // 726
    const page = buildLandscapePage([
      { id: "f1", x: 44 + 121, y: 100, w: wideNodeW, h: 200 },
    ]);

    const patches = applyOrientation([page], "portrait");
    const portraitSafe = computeSafeBox(patches[0].widthPx, patches[0].heightPx, margins);
    const fp = patches[0].framePatch[0];

    const newRelW = fp.w / portraitSafe.w;
    expect(newRelW).toBeCloseTo(0.75, 1);
  });

  it("no nodes end outside safe area after portrait→landscape switch", () => {
    const portraitSafe = computeSafeBox(816, 1056, margins);
    const page = buildPortraitPage([
      { id: "f1", x: 44, y: 44, w: Math.round(portraitSafe.w * 0.9), h: 200 }, // wide
      { id: "f2", x: 600, y: 800, w: 150, h: 100 }, // fixed, near edge
      { id: "f3", x: 44, y: 44, w: portraitSafe.w, h: portraitSafe.h }, // full safe area
    ]);

    const patches = applyOrientation([page], "landscape");
    const landscapeSafe = computeSafeBox(patches[0].widthPx, patches[0].heightPx, margins);

    for (const fp of patches[0].framePatch) {
      expect(fp.x).toBeGreaterThanOrEqual(landscapeSafe.x);
      expect(fp.y).toBeGreaterThanOrEqual(landscapeSafe.y);
      expect(fp.x + fp.w).toBeLessThanOrEqual(landscapeSafe.x + landscapeSafe.w + 1); // +1 for rounding
      expect(fp.y + fp.h).toBeLessThanOrEqual(landscapeSafe.y + landscapeSafe.h + 1);
    }
  });

  it("no nodes end outside safe area after landscape→portrait switch", () => {
    const landscapeSafe = computeSafeBox(1056, 816, margins);
    const page = buildLandscapePage([
      { id: "f1", x: 44, y: 44, w: Math.round(landscapeSafe.w * 0.85), h: 150 }, // wide
      { id: "f2", x: 900, y: 600, w: 100, h: 100 }, // fixed, near edge
    ]);

    const patches = applyOrientation([page], "portrait");
    const portraitSafe = computeSafeBox(patches[0].widthPx, patches[0].heightPx, margins);

    for (const fp of patches[0].framePatch) {
      expect(fp.x).toBeGreaterThanOrEqual(portraitSafe.x);
      expect(fp.y).toBeGreaterThanOrEqual(portraitSafe.y);
      expect(fp.x + fp.w).toBeLessThanOrEqual(portraitSafe.x + portraitSafe.w + 1);
      expect(fp.y + fp.h).toBeLessThanOrEqual(portraitSafe.y + portraitSafe.h + 1);
    }
  });

  it("no-op when already in target orientation", () => {
    const page = buildPortraitPage([
      { id: "f1", x: 100, y: 200, w: 300, h: 400 },
    ]);

    const patches = applyOrientation([page], "portrait");
    expect(patches[0].widthPx).toBe(816);
    expect(patches[0].heightPx).toBe(1056);

    // Frame should be unchanged (or very close)
    const fp = patches[0].framePatch[0];
    expect(Math.abs(fp.x - 100)).toBeLessThanOrEqual(1);
    expect(Math.abs(fp.y - 200)).toBeLessThanOrEqual(1);
    expect(Math.abs(fp.w - 300)).toBeLessThanOrEqual(1);
    expect(Math.abs(fp.h - 400)).toBeLessThanOrEqual(1);
  });

  it("page dimensions swap correctly", () => {
    const page = buildPortraitPage([]);
    const patches = applyOrientation([page], "landscape");
    expect(patches[0].widthPx).toBe(1056);
    expect(patches[0].heightPx).toBe(816);
  });
});
