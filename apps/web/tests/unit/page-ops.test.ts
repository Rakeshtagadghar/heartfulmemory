import {
  insertPageIdAfter,
  normalizePageUiStateMapV1,
  reorderPagesByMove,
  upsertPageUiStateV1
} from "../../../../packages/editor/model/pageOps";

describe("pageOps", () => {
  it("reorders pages by move direction", () => {
    const pages = [
      { id: "p1", order_index: 0 },
      { id: "p2", order_index: 1 },
      { id: "p3", order_index: 2 }
    ];
    const moved = reorderPagesByMove(pages, "p2", 1);
    expect(moved.map((page) => page.id)).toEqual(["p1", "p3", "p2"]);
    expect(moved.map((page) => page.order_index)).toEqual([0, 1, 2]);
  });

  it("inserts page id after anchor", () => {
    const ordered = ["p1", "p2", "p3"];
    expect(insertPageIdAfter(ordered, "p4", "p2")).toEqual(["p1", "p2", "p4", "p3"]);
  });

  it("normalizes and upserts page ui state", () => {
    const normalized = normalizePageUiStateMapV1({
      p1: { title: "Cover", isHidden: true },
      bad: "skip-me"
    });
    expect(normalized.p1).toEqual({ title: "Cover", isHidden: true, isLocked: undefined });
    const next = upsertPageUiStateV1(normalized, "p1", { isLocked: true });
    expect(next.p1).toEqual({ title: "Cover", isHidden: true, isLocked: true });
  });
});
