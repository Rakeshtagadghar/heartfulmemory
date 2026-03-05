"use client";

import { track } from "./client";

type Props = Record<string, string | number | boolean | null | undefined>;

export function trackCreateEntryView(props?: Props) {
  track("cta_click", {
    cta_id: "create_entry_view",
    placement:
      typeof props?.source === "string" && props.source.trim().length > 0
        ? props.source
        : "create_entry"
  });
}

export function trackTemplateSelectView(props?: Props) {
  track("cta_click", {
    cta_id: "template_select_view",
    placement:
      typeof props?.source === "string" && props.source.trim().length > 0
        ? props.source
        : "template_gallery"
  });
}

export function trackTemplateSelectChoose(templateId: string) {
  track("cta_click", {
    cta_id: "template_select_choose",
    placement: "template_gallery",
    template_id: templateId
  });
}

export function trackCreateFreeformChoose() {
  track("cta_click", {
    cta_id: "create_freeform_choose",
    placement: "create_entry"
  });
}

export function trackChaptersView(storybookId: string) {
  track("storybook_open", { storybook_id: storybookId });
}

export function trackChapterStart(chapterKey: string) {
  track("storybook_step_view", { step_id: chapterKey, chapter_id: chapterKey });
}

export function trackWizardStepNext(questionId: string) {
  track("storybook_step_complete", {
    step_id: questionId,
    question_id: questionId,
    action: "next"
  });
}

export function trackWizardStepSkip(questionId: string) {
  track("storybook_step_complete", {
    step_id: questionId,
    question_id: questionId,
    action: "skip"
  });
}

export function trackChapterComplete(chapterKey: string) {
  track("storybook_step_complete", {
    step_id: chapterKey,
    chapter_id: chapterKey,
    action: "chapter_complete"
  });
}

export function trackOpenStudioFromChapter(chapterKey: string) {
  track("studio_enter", {
    entry_point: "chapter_flow",
    chapter_key: chapterKey
  });
}
