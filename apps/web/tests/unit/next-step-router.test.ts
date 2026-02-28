import { describe, expect, it } from "vitest";
import { resolveNextChapterRoute } from "../../lib/chapters/nextStepRouter";

describe("nextStepRouter", () => {
  const completedChapter = {
    id: "ch_inst_1",
    storybookId: "sb_1",
    chapterKey: "origins",
    title: "Origins",
    orderIndex: 0,
    status: "completed" as const,
    completedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  it("routes incomplete chapters to wizard", () => {
    const route = resolveNextChapterRoute({
      storybookId: "sb_1",
      chapter: { ...completedChapter, status: "in_progress", completedAt: null }
    });
    expect(route.kind).toBe("wizard");
    expect(route.href).toContain("/wizard");
  });

  it("routes completed chapters back to chapters list (v3 flow: no draft/illustrations steps)", () => {
    const route = resolveNextChapterRoute({
      storybookId: "sb_1",
      chapter: completedChapter
    });
    expect(route.kind).toBe("chapters");
    expect(route.href).toBe("/book/sb_1/chapters");
  });

  it("falls back to chapters index when there is no next chapter", () => {
    const route = resolveNextChapterRoute({
      storybookId: "sb_1",
      chapter: null
    });
    expect(route).toEqual({ kind: "chapters", href: "/book/sb_1/chapters" });
  });
});
