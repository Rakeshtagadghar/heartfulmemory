import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captureAppError,
  captureAppWarning,
  registerObservabilityAdapter,
  type ObservabilityAdapter
} from "../../../../lib/observability/capture";
import type { AppCapturePayload } from "../../../../lib/observability/sentryContext";

describe("observability capture helpers", () => {
  afterEach(() => {
    registerObservabilityAdapter(null);
  });

  it("captures exceptions with normalized tags and redacted extra fields", () => {
    let capturedPayload: AppCapturePayload | null = null;
    const adapter: ObservabilityAdapter = {
      captureException(_error, payload) {
        capturedPayload = payload;
        return "event-1";
      },
      captureMessage: vi.fn()
    };
    registerObservabilityAdapter(adapter);

    const eventId = captureAppError(new Error("Provider timeout"), {
      runtime: "server",
      flow: "draft_generate_v2",
      feature: "ai",
      code: "PROVIDER_ERROR",
      storybookId: "sb_123",
      chapterKey: "origins",
      chapterInstanceId: "ch_123",
      extra: {
        promptText: "this should not be sent",
        attempt: 2
      }
    });

    expect(eventId).toBe("event-1");
    if (!capturedPayload) throw new Error("Expected payload to be captured");
    const payload = capturedPayload as unknown as AppCapturePayload;
    const extra = payload.extra;
    expect(payload.tags.flow).toBe("draft_generate_v2");
    expect(payload.tags.errorCode).toBe("PROVIDER_ERROR");
    expect(extra.promptText).toBe("[REDACTED]");
    expect(extra.attempt).toBe(2);
  });

  it("captures warnings with the same payload shape", () => {
    const captureMessage = vi.fn(() => "event-2");
    registerObservabilityAdapter({
      captureException: vi.fn(),
      captureMessage
    });

    const eventId = captureAppWarning("no candidates", {
      runtime: "convex",
      flow: "auto_illustrate",
      code: "NO_CANDIDATES",
      provider: "unsplash"
    });

    expect(eventId).toBe("event-2");
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
