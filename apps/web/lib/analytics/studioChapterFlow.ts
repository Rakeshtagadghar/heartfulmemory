"use client";

import { track } from "./client";

type Props = Record<string, string | number | boolean | null | undefined>;

export function trackPopulateChapterStart(props: Props) {
  track("populate_chapter_start", props);
}

export function trackPopulateChapterSuccess(props: Props) {
  track("populate_chapter_success", props);
}

export function trackPopulateChapterError(props: Props) {
  track("populate_chapter_error", props);
}

export function trackStudioChapterNavPrev(props: Props) {
  track("studio_chapter_nav_prev", props);
}

export function trackStudioChapterNavNext(props: Props) {
  track("studio_chapter_nav_next", props);
}

export function trackChapterMarkFinalized(props: Props) {
  track("chapter_mark_finalized", props);
}
