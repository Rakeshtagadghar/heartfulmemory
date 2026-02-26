import { beforeEach, describe, expect, it, vi } from "vitest";

const trackMock = vi.fn();

vi.mock("../../lib/analytics/client", () => ({
  track: (...args: unknown[]) => trackMock(...args)
}));

import {
  trackDraftApprove,
  trackDraftGenerateError,
  trackDraftGenerateStart,
  trackDraftGenerateSuccess,
  trackDraftRegenSectionStart,
  trackDraftRegenSectionSuccess
} from "../../lib/analytics/draftFlow";

describe("draftFlow analytics helpers", () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  it("emits sprint 19 draft funnel events with metadata only", () => {
    const props = {
      provider: "heuristic",
      chapterKey: "ch_school_days",
      voice: "third_person",
      tense: "past",
      tone: "warm",
      length: "medium"
    } as const;

    trackDraftGenerateStart(props);
    trackDraftGenerateSuccess(props);
    trackDraftGenerateError({ ...props, error_code: "RATE_LIMIT" });
    trackDraftRegenSectionStart({ ...props, sectionId: "intro" });
    trackDraftRegenSectionSuccess({ ...props, sectionId: "intro" });
    trackDraftApprove({ ...props, version: 2 });

    expect(trackMock.mock.calls.map((call) => call[0])).toEqual([
      "draft_generate_start",
      "draft_generate_success",
      "draft_generate_error",
      "draft_regen_section_start",
      "draft_regen_section_success",
      "draft_approve"
    ]);

    for (const [, eventProps] of trackMock.mock.calls) {
      expect(eventProps).not.toHaveProperty("summary");
      expect(eventProps).not.toHaveProperty("text");
      expect(eventProps).not.toHaveProperty("content");
    }
  });
});

