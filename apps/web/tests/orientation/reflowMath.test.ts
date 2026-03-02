import { describe, expect, it } from "vitest";
import {
  computeSafeBox,
  toRelativeRect,
  fromRelativeRect,
  clampRectToBox,
} from "../../../../packages/shared/orientation/reflowMath";

describe("computeSafeBox", () => {
  it("computes safe box from page dimensions and margins", () => {
    const box = computeSafeBox(816, 1056, { top: 44, right: 44, bottom: 44, left: 44 });
    expect(box).toEqual({ x: 44, y: 44, w: 728, h: 968 });
  });

  it("returns zero-width safe box when margins exceed page", () => {
    const box = computeSafeBox(100, 200, { top: 50, right: 60, bottom: 50, left: 60 });
    expect(box.w).toBe(0);
    expect(box.h).toBe(100);
  });
});

describe("toRelativeRect / fromRelativeRect round-trip", () => {
  const portraitSafe = { x: 44, y: 44, w: 728, h: 968 };
  const landscapeSafe = { x: 44, y: 44, w: 968, h: 728 };

  it("round-trips through same safe box with <= 1px drift", () => {
    const rect = { x: 100, y: 200, w: 500, h: 300 };
    const rel = toRelativeRect(rect, portraitSafe);
    const restored = fromRelativeRect(rel, portraitSafe);

    expect(Math.abs(restored.x - rect.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(restored.y - rect.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(restored.w - rect.w)).toBeLessThanOrEqual(1);
    expect(Math.abs(restored.h - rect.h)).toBeLessThanOrEqual(1);
  });

  it("maps a wide node from portrait to landscape safe box", () => {
    // Node at 80% of portrait safe width
    const nodeW = Math.round(728 * 0.8); // 582
    const rect = { x: 44 + 73, y: 44 + 100, w: nodeW, h: 200 };
    const rel = toRelativeRect(rect, portraitSafe);

    // Relative width should be ~0.8
    expect(rel.rw).toBeCloseTo(0.8, 1);

    // Map to landscape
    const mapped = fromRelativeRect(rel, landscapeSafe);

    // New width should be ~80% of landscape safe width (968 * 0.8 = 774)
    const expectedW = Math.round(0.8 * 968);
    expect(Math.abs(mapped.w - expectedW)).toBeLessThanOrEqual(2);
  });

  it("preserves relative position across safe boxes", () => {
    // Node centered horizontally in portrait safe box
    const rect = { x: 44 + 364 - 100, y: 44 + 100, w: 200, h: 100 };
    const rel = toRelativeRect(rect, portraitSafe);

    // rx should be roughly 0.5 - 0.137 ≈ 0.36
    const mapped = fromRelativeRect(rel, landscapeSafe);

    // Position should be proportionally mapped
    expect(mapped.x).toBeGreaterThanOrEqual(landscapeSafe.x);
    expect(mapped.x + mapped.w).toBeLessThanOrEqual(landscapeSafe.x + landscapeSafe.w + 1);
  });
});

describe("clampRectToBox", () => {
  const safeBox = { x: 44, y: 44, w: 728, h: 968 };

  it("does not change a rect that already fits", () => {
    const rect = { x: 100, y: 100, w: 200, h: 300 };
    expect(clampRectToBox(rect, safeBox)).toEqual(rect);
  });

  it("shrinks width that exceeds safe box", () => {
    const rect = { x: 44, y: 44, w: 900, h: 100 };
    const clamped = clampRectToBox(rect, safeBox);
    expect(clamped.w).toBe(728);
    expect(clamped.x).toBe(44);
  });

  it("pushes rect back inside when it extends beyond right edge", () => {
    const rect = { x: 700, y: 44, w: 200, h: 100 };
    const clamped = clampRectToBox(rect, safeBox);
    expect(clamped.x + clamped.w).toBeLessThanOrEqual(safeBox.x + safeBox.w);
    expect(clamped.x).toBeGreaterThanOrEqual(safeBox.x);
  });

  it("pushes rect back inside when it extends beyond bottom edge", () => {
    const rect = { x: 100, y: 950, w: 100, h: 200 };
    const clamped = clampRectToBox(rect, safeBox);
    expect(clamped.y + clamped.h).toBeLessThanOrEqual(safeBox.y + safeBox.h);
    expect(clamped.y).toBeGreaterThanOrEqual(safeBox.y);
  });

  it("handles rect completely outside safe box", () => {
    const rect = { x: -100, y: -100, w: 50, h: 50 };
    const clamped = clampRectToBox(rect, safeBox);
    expect(clamped.x).toBeGreaterThanOrEqual(safeBox.x);
    expect(clamped.y).toBeGreaterThanOrEqual(safeBox.y);
  });
});
