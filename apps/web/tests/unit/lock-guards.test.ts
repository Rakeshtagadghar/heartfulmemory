import { canEnterCropMode, canEnterTextEdit, canMoveNode, canResizeNode } from "../../../../packages/editor/interaction/lockGuards";

describe("lockGuards", () => {
  it("blocks move/resize when locked", () => {
    const node = { id: "n1", type: "IMAGE", locked: true };
    expect(canMoveNode(node)).toBe(false);
    expect(canResizeNode(node)).toBe(false);
  });

  it("blocks text edit and crop when locked, allows when unlocked", () => {
    expect(canEnterTextEdit({ id: "t1", type: "TEXT", locked: true })).toBe(false);
    expect(canEnterTextEdit({ id: "t1", type: "TEXT", locked: false })).toBe(true);
    expect(canEnterCropMode({ id: "i1", type: "IMAGE", locked: true })).toBe(false);
    expect(canEnterCropMode({ id: "i1", type: "IMAGE", locked: false })).toBe(true);
  });
});
