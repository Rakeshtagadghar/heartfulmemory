import type { PageViewMode } from "./viewMode";

export function shouldClearSelectionOnModeSwitch(input: {
  previousMode: PageViewMode;
  nextMode: PageViewMode;
}) {
  return input.previousMode !== input.nextMode;
}
