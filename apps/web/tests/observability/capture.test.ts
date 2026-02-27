import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captureAppError,
  captureAppWarning,
  registerObservabilityAdapter,
  type ObservabilityAdapter
} from "../../../../lib/observability/capture";
import type { AppCapturePayload } from "../../../../lib/observability/sentryContext";

describe("capture helpers", () => {
  afterEach(() => {
    registerObservabilityAdapter(null);
  });

  it("attaches consistent tags and redacts extra values", () => {
    const payloads: AppCapturePayload[] = [];
    const adapter: ObservabilityAdapter = {
      captureException(_error, nextPayload) {
        payloads.push(nextPayload);
        return "evt-1";
      },
      captureMessage: vi.fn()
    };
    registerObservabilityAdapter(adapter);

    const eventId = captureAppError(new Error("Provider timeout"), {
      runtime: "server",
      flow: "draft_generate_v2",
      code: "PROVIDER_ERROR",
      storybookId: "sb_1",
      chapterKey: "origins",
      extra: {
        promptText: "must be redacted"
      }
    });

    expect(eventId).toBe("evt-1");
    expect(payloads).toHaveLength(1);
    const [payload] = payloads;
    expect(payload.tags.flow).toBe("draft_generate_v2");
    expect(payload.tags.errorCode).toBe("PROVIDER_ERROR");
    expect(payload.extra.promptText).toBe("[REDACTED]");
  });

  it("captures warnings with normalized context", () => {
    const captureMessage = vi.fn(() => "evt-2");
    registerObservabilityAdapter({
      captureException: vi.fn(),
      captureMessage
    });

    const id = captureAppWarning("no candidates", {
      runtime: "convex",
      flow: "auto_illustrate",
      code: "NO_CANDIDATES",
      provider: "unsplash"
    });

    expect(id).toBe("evt-2");
    expect(captureMessage).toHaveBeenCalledWith(
      "no candidates",
      "warning",
      expect.objectContaining({
        tags: expect.objectContaining({
          flow: "auto_illustrate",
          provider: "unsplash",
          errorCode: "NO_CANDIDATES"
        })
      })
    );
  });
});
