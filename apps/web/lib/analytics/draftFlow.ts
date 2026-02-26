"use client";

import { track } from "./client";

type Props = Record<string, string | number | boolean | null | undefined>;

export function trackDraftGenerateStart(props: Props) {
  track("draft_generate_start", props);
}

export function trackDraftGenerateSuccess(props: Props) {
  track("draft_generate_success", props);
}

export function trackDraftGenerateError(props: Props) {
  track("draft_generate_error", props);
}

export function trackDraftRegenSectionStart(props: Props) {
  track("draft_regen_section_start", props);
}

export function trackDraftRegenSectionSuccess(props: Props) {
  track("draft_regen_section_success", props);
}

export function trackDraftApprove(props: Props) {
  track("draft_approve", props);
}
