"use client";

import { track } from "./client";

type CreationEventProps = Record<string, string | number | boolean | null | undefined>;

export function trackStorybookCreateStart(props?: CreationEventProps) {
  track("storybook_create_start", props);
}

export function trackTemplateView(props?: CreationEventProps) {
  track("template_view", props);
}

export function trackTemplateApply(props?: CreationEventProps) {
  track("template_apply", props);
}

export function trackStorybookCreated(props?: CreationEventProps) {
  track("storybook_created", props);
}

export function trackStorybookRename(props?: CreationEventProps) {
  track("storybook_rename", props);
}

export function trackChapterSelected(props?: CreationEventProps) {
  track("chapter_selected", props);
}

export function trackBlockInserted(props?: CreationEventProps) {
  track("block_inserted", props);
}

export function trackChapterFirstSave(props?: CreationEventProps) {
  track("chapter_first_save", props);
}

