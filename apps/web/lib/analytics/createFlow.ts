"use client";

import { track } from "./client";

type Props = Record<string, string | number | boolean | null | undefined>;

export function trackCreateEntryView(props?: Props) {
  track("create_entry_view", props);
}

export function trackTemplateSelectView(props?: Props) {
  track("template_select_view", props);
}

export function trackTemplateSelectChoose(templateId: string) {
  track("template_select_choose", { templateId });
}

export function trackCreateFreeformChoose() {
  track("create_freeform_choose");
}

export function trackChaptersView(storybookId: string) {
  track("chapters_view", { storybookId });
}

export function trackChapterStart(chapterKey: string) {
  track("chapter_start", { chapterKey });
}

export function trackWizardStepNext(questionId: string) {
  track("wizard_step_next", { questionId });
}

export function trackWizardStepSkip(questionId: string) {
  track("wizard_step_skip", { questionId });
}

export function trackChapterComplete(chapterKey: string) {
  track("chapter_complete", { chapterKey });
}

export function trackOpenStudioFromChapter(chapterKey: string) {
  track("open_studio_from_chapter", { chapterKey });
}

