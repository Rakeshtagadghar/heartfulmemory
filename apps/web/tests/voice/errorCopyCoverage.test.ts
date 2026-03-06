import { describe, expect, it } from "vitest";
import { VOICE_ERROR_COPY } from "../../lib/voice/errors/voiceErrorCopy";
import {
  VOICE_ERROR_CODES,
  isMicSetupError,
  normalizeVoiceErrorCode
} from "../../lib/voice/errors/voiceErrorCodes";

describe("voiceErrorCopy coverage", () => {
  it("provides copy for every stable voice error code", () => {
    for (const code of VOICE_ERROR_CODES) {
      expect(VOICE_ERROR_COPY[code]).toBeDefined();
      expect(VOICE_ERROR_COPY[code].title.length).toBeGreaterThan(0);
      expect(VOICE_ERROR_COPY[code].description.length).toBeGreaterThan(0);
    }
  });

  it("normalizes legacy backend and recorder codes into the sprint 44 taxonomy", () => {
    expect(normalizeVoiceErrorCode("PROVIDER_TIMEOUT")).toBe("STT_TIMEOUT");
    expect(normalizeVoiceErrorCode("NETWORK")).toBe("STT_NETWORK_ERROR");
    expect(normalizeVoiceErrorCode("SESSION_LOCKED")).toBe("MIC_IN_USE");
    expect(normalizeVoiceErrorCode("UNSUPPORTED_BROWSER")).toBe("MIC_UNSUPPORTED_BROWSER");
  });

  it("marks setup failures as microphone help candidates", () => {
    expect(isMicSetupError("MIC_PERMISSION_DENIED")).toBe(true);
    expect(isMicSetupError("MIC_NOT_FOUND")).toBe(true);
    expect(isMicSetupError("STT_TIMEOUT")).toBe(false);
  });
});
