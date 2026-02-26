import { beforeEach, describe, expect, it, vi } from "vitest";

const trackMock = vi.fn();

vi.mock("../../lib/analytics/client", () => ({
  track: (...args: unknown[]) => trackMock(...args)
}));

import {
  trackChapterComplete,
  trackChapterStart,
  trackChaptersView,
  trackCreateEntryView,
  trackCreateFreeformChoose,
  trackOpenStudioFromChapter,
  trackTemplateSelectChoose,
  trackTemplateSelectView,
  trackWizardStepNext,
  trackWizardStepSkip
} from "../../lib/analytics/createFlow";

describe("createFlow analytics helpers", () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  it("emits the expected event names and payloads", () => {
    trackCreateEntryView();
    trackTemplateSelectView();
    trackTemplateSelectChoose("tpl_childhood_roots_v2");
    trackCreateFreeformChoose();
    trackChaptersView("sb_1");
    trackChapterStart("ch_origins");
    trackWizardStepNext("q1");
    trackWizardStepSkip("q2");
    trackChapterComplete("ch_origins");
    trackOpenStudioFromChapter("ch_origins");

    expect(trackMock.mock.calls).toEqual([
      ["create_entry_view", undefined],
      ["template_select_view", undefined],
      ["template_select_choose", { templateId: "tpl_childhood_roots_v2" }],
      ["create_freeform_choose"],
      ["chapters_view", { storybookId: "sb_1" }],
      ["chapter_start", { chapterKey: "ch_origins" }],
      ["wizard_step_next", { questionId: "q1" }],
      ["wizard_step_skip", { questionId: "q2" }],
      ["chapter_complete", { chapterKey: "ch_origins" }],
      ["open_studio_from_chapter", { chapterKey: "ch_origins" }]
    ]);
  });
});
