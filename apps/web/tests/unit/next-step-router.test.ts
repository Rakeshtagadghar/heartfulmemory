import { describe, expect, it } from "vitest";
import { resolveNextChapterRoute } from "../../lib/chapters/nextStepRouter";
import type { ChapterDraftRecord, ChapterIllustrationRecord, ChapterStudioStateRecord } from "../../lib/data/create-flow";

describe("nextStepRouter", () => {
  const base = {
    storybookId: "sb_1",
    chapter: {
      id: "ch_inst_1",
      storybookId: "sb_1",
      chapterKey: "origins",
      title: "Origins",
      orderIndex: 0,
      status: "completed",
      completedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    latestDraft: null,
    latestIllustration: null,
    studioState: null
  } as const;

  it("routes incomplete chapters to wizard", () => {
    const route = resolveNextChapterRoute({
      ...base,
      chapter: { ...base.chapter, status: "in_progress", completedAt: null }
    });
    expect(route.kind).toBe("wizard");
    expect(route.href).toContain("/wizard");
  });

  it("routes completed chapters without ready draft to draft screen", () => {
    const route = resolveNextChapterRoute({ ...base });
    expect(route.kind).toBe("draft");
    expect(route.href).toContain("/draft");
  });

  it("routes to illustrations when draft is ready but illustrations are not", () => {
    const route = resolveNextChapterRoute({
      ...base,
      latestDraft: { status: "ready" } as unknown as ChapterDraftRecord
    });
    expect(route.kind).toBe("illustrations");
    expect(route.href).toContain("/illustrations");
  });

  it("routes to studio when draft + illustrations are ready", () => {
    const route = resolveNextChapterRoute({
      ...base,
      latestDraft: { status: "ready" } as unknown as ChapterDraftRecord,
      latestIllustration: { status: "ready" } as unknown as ChapterIllustrationRecord,
      studioState: { pageIds: ["page_abc"] } as unknown as ChapterStudioStateRecord
    });
    expect(route.kind).toBe("studio");
    expect(route.href).toContain("/studio/sb_1");
    expect(route.href).toContain("chapter=ch_inst_1");
    expect(route.href).toContain("page=page_abc");
  });

  it("falls back to chapters index when there is no next chapter", () => {
    const route = resolveNextChapterRoute({
      storybookId: "sb_1",
      chapter: null,
      latestDraft: null,
      latestIllustration: null,
      studioState: null
    });
    expect(route).toEqual({ kind: "chapters", href: "/book/sb_1/chapters" });
  });
});
