import { beforeEach, describe, expect, it, vi } from "vitest";

const trackMock = vi.fn();

vi.mock("../../lib/analytics/client", () => ({
  track: (...args: unknown[]) => trackMock(...args)
}));

import {
  trackAutoIllustrateError,
  trackAutoIllustrateStart,
  trackAutoIllustrateSuccess,
  trackIllustrationLockToggle,
  trackIllustrationRegenerate,
  trackIllustrationReplace
} from "../../lib/analytics/illustrations";

describe("Sprint 20 illustration analytics helpers", () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  it("emits the expected auto-illustrate funnel events", () => {
    trackAutoIllustrateStart({ chapterKey: "ch_childhood" });
    trackAutoIllustrateSuccess({ chapterKey: "ch_childhood", version: 2 });
    trackAutoIllustrateError({ chapterKey: "ch_childhood", error_code: "NO_CANDIDATES" });
    trackIllustrationLockToggle({ chapterKey: "ch_childhood", slotId: "image1" });
    trackIllustrationReplace({ chapterKey: "ch_childhood", slotId: "image2", provider: "unsplash" });
    trackIllustrationRegenerate({ chapterKey: "ch_childhood" });

    expect(trackMock.mock.calls.map((call) => call[0])).toEqual([
      "auto_illustrate_start",
      "auto_illustrate_success",
      "auto_illustrate_error",
      "illustration_lock_toggle",
      "illustration_replace",
      "illustration_regenerate"
    ]);
  });
});
