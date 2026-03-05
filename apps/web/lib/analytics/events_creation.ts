"use client";

import { track } from "./client";

type CreationEventProps = Record<string, string | number | boolean | null | undefined>;

export function trackStorybookCreateStart(props?: CreationEventProps) {
  track("storybook_create_start", {
    template_id:
      typeof props?.template_id === "string" && props.template_id.trim().length > 0
        ? props.template_id
        : undefined,
    entry_point:
      typeof props?.source === "string" && props.source.trim().length > 0
        ? props.source
        : undefined,
    kind:
      typeof props?.kind === "string" && props.kind.trim().length > 0
        ? props.kind
        : undefined
  });
}

export function trackTemplateView(props?: CreationEventProps) {
  track("cta_click", {
    cta_id: "template_view",
    placement:
      typeof props?.source === "string" && props.source.trim().length > 0
        ? props.source
        : "template_gallery",
    template_id:
      typeof props?.template_id === "string" && props.template_id.trim().length > 0
        ? props.template_id
        : undefined
  });
}

export function trackTemplateApply(props?: CreationEventProps) {
  track("cta_click", {
    cta_id: "template_apply",
    placement:
      typeof props?.source === "string" && props.source.trim().length > 0
        ? props.source
        : "template_gallery",
    template_id:
      typeof props?.template_id === "string" && props.template_id.trim().length > 0
        ? props.template_id
        : undefined
  });
}

export function trackStorybookCreated(props?: CreationEventProps) {
  track("storybook_create", {
    template_id:
      typeof props?.template_id === "string" && props.template_id.trim().length > 0
        ? props.template_id
        : "unknown",
    entry_point:
      typeof props?.source === "string" && props.source.trim().length > 0
        ? props.source
        : undefined,
    template_version: props?.template_version
  });
}

export function trackStorybookRename(props?: CreationEventProps) {
  track("storybook_rename", {
    storybook_id:
      typeof props?.storybook_id === "string" && props.storybook_id.trim().length > 0
        ? props.storybook_id
        : "unknown",
    title_changed: Boolean(props?.title_changed),
    subtitle_changed: Boolean(props?.subtitle_changed)
  });
}

export function trackChapterSelected(props?: CreationEventProps) {
  track("storybook_step_view", {
    step_id:
      typeof props?.chapter_id === "string" && props.chapter_id.trim().length > 0
        ? props.chapter_id
        : "chapter_unknown",
    chapter_id:
      typeof props?.chapter_id === "string" && props.chapter_id.trim().length > 0
        ? props.chapter_id
        : undefined
  });
}

export function trackBlockInserted(props?: CreationEventProps) {
  track("block_inserted", {
    storybook_id:
      typeof props?.storybook_id === "string" && props.storybook_id.trim().length > 0
        ? props.storybook_id
        : undefined,
    chapter_id:
      typeof props?.chapter_id === "string" && props.chapter_id.trim().length > 0
        ? props.chapter_id
        : undefined,
    block_type:
      typeof props?.block_type === "string" && props.block_type.trim().length > 0
        ? props.block_type
        : undefined
  });
}

export function trackChapterFirstSave(props?: CreationEventProps) {
  track("storybook_step_complete", {
    step_id: "chapter_first_save",
    storybook_id:
      typeof props?.storybook_id === "string" && props.storybook_id.trim().length > 0
        ? props.storybook_id
        : undefined,
    chapter_id:
      typeof props?.chapter_id === "string" && props.chapter_id.trim().length > 0
        ? props.chapter_id
        : undefined
  });
}
