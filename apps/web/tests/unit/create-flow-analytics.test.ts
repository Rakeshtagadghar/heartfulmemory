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
      ["cta_click", { cta_id: "create_entry_view", placement: "create_entry" }],
      ["cta_click", { cta_id: "template_select_view", placement: "template_gallery" }],
      ["cta_click", { cta_id: "template_select_choose", placement: "template_gallery", template_id: "tpl_childhood_roots_v2" }],
      ["cta_click", { cta_id: "create_freeform_choose", placement: "create_entry" }],
      ["storybook_open", { storybook_id: "sb_1" }],
      ["storybook_step_view", { step_id: "ch_origins", chapter_id: "ch_origins" }],
      ["storybook_step_complete", { step_id: "q1", question_id: "q1", action: "next" }],
      ["storybook_step_complete", { step_id: "q2", question_id: "q2", action: "skip" }],
      ["storybook_step_complete", { step_id: "ch_origins", chapter_id: "ch_origins", action: "chapter_complete" }],
      ["studio_enter", { entry_point: "chapter_flow", chapter_key: "ch_origins" }]
    ]);
  });
});
