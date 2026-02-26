import { beforeEach, describe, expect, it, vi } from "vitest";

const trackMock = vi.fn();

vi.mock("../../lib/analytics/client", () => ({
  track: (...args: unknown[]) => trackMock(...args)
}));

import {
  trackChapterMarkFinalized,
  trackPopulateChapterError,
  trackPopulateChapterStart,
  trackPopulateChapterSuccess,
  trackStudioChapterNavNext,
  trackStudioChapterNavPrev
} from "../../lib/analytics/studioChapterFlow";

describe("studioChapterFlow analytics helpers", () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  it("emits Sprint 21 populate/navigation events without content payloads", () => {
    trackPopulateChapterStart({ chapterKey: "origins" });
    trackPopulateChapterSuccess({ chapterKey: "origins", created_nodes: 5 });
    trackPopulateChapterError({ chapterKey: "origins", error_code: "POPULATE_FAILED" });
    trackStudioChapterNavPrev({ chapterKey: "origins" });
    trackStudioChapterNavNext({ chapterKey: "school" });
    trackChapterMarkFinalized({ chapterKey: "origins" });

    expect(trackMock.mock.calls.map((call) => call[0])).toEqual([
      "populate_chapter_start",
      "populate_chapter_success",
      "populate_chapter_error",
      "studio_chapter_nav_prev",
      "studio_chapter_nav_next",
      "chapter_mark_finalized"
    ]);

    for (const [, props] of trackMock.mock.calls) {
      expect(props).not.toHaveProperty("text");
      expect(props).not.toHaveProperty("content");
      expect(props).not.toHaveProperty("summary");
    }
  });
});

