"use client";

import { track } from "./client";

type Props = Record<string, string | number | boolean | null | undefined>;

export function trackAutoIllustrateStart(props: Props) {
  track("auto_illustrate_start", props);
}

export function trackAutoIllustrateSuccess(props: Props) {
  track("auto_illustrate_success", props);
}

export function trackAutoIllustrateError(props: Props) {
  track("auto_illustrate_error", props);
}

export function trackIllustrationLockToggle(props: Props) {
  track("illustration_lock_toggle", props);
}

export function trackIllustrationReplace(props: Props) {
  track("illustration_replace", props);
}

export function trackIllustrationRegenerate(props: Props) {
  track("illustration_regenerate", props);
}

