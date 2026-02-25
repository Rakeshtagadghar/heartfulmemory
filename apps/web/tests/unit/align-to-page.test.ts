import { buildAlignToPagePatches } from "../../../../packages/editor/commands/alignToPage";

describe("alignToPage", () => {
  it("aligns multiple nodes to page center X and skips locked nodes", () => {
    const patches = buildAlignToPagePatches(
      [
        { id: "a", x: 10, y: 10, w: 100, h: 50, locked: false },
        { id: "b", x: 40, y: 20, w: 200, h: 70, locked: true }
      ],
      { width: 800, height: 1000 },
      "centerX"
    );

    expect(patches).toEqual([{ id: "a", x: 350 }]);
  });

  it("aligns bottom to page", () => {
    const [patch] = buildAlignToPagePatches(
      [{ id: "a", x: 0, y: 0, w: 100, h: 120 }],
      { width: 500, height: 700 },
      "bottom"
    );

    expect(patch).toEqual({ id: "a", y: 580 });
  });
});
