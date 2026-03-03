import { describe, expect, it, beforeEach } from "vitest";
import {
  acquireVoiceSession,
  releaseVoiceSession,
  getActiveVoiceContext
} from "../../../../apps/web/lib/voice/voiceSessionLock";

describe("voiceSessionLock", () => {
  beforeEach(() => {
    // Clean up any held session
    releaseVoiceSession("wizard");
    releaseVoiceSession("studio");
  });

  it("grants acquisition to first caller", () => {
    expect(acquireVoiceSession("wizard")).toBe(true);
    expect(getActiveVoiceContext()).toBe("wizard");
  });

  it("denies acquisition to a different context", () => {
    acquireVoiceSession("wizard");
    expect(acquireVoiceSession("studio")).toBe(false);
    expect(getActiveVoiceContext()).toBe("wizard");
  });

  it("allows same context to re-acquire (idempotent)", () => {
    acquireVoiceSession("wizard");
    expect(acquireVoiceSession("wizard")).toBe(true);
    expect(getActiveVoiceContext()).toBe("wizard");
  });

  it("release allows subsequent acquisition from different context", () => {
    acquireVoiceSession("wizard");
    releaseVoiceSession("wizard");
    expect(getActiveVoiceContext()).toBe(null);
    expect(acquireVoiceSession("studio")).toBe(true);
    expect(getActiveVoiceContext()).toBe("studio");
  });

  it("release from wrong context does not clear the lock", () => {
    acquireVoiceSession("wizard");
    releaseVoiceSession("studio");
    expect(getActiveVoiceContext()).toBe("wizard");
  });

  it("starts with no active context", () => {
    expect(getActiveVoiceContext()).toBe(null);
  });
});
