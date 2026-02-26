import { beforeEach, describe, expect, it, vi } from "vitest";

const trackMock = vi.fn();

vi.mock("../../lib/analytics/client", () => ({
  track: (...args: unknown[]) => trackMock(...args)
}));

import {
  trackVoiceAnswerConfirm,
  trackVoiceRecordStart,
  trackVoiceRecordStop,
  trackVoiceTranscriptEdit,
  trackVoiceTranscribeError,
  trackVoiceTranscribeStart,
  trackVoiceTranscribeSuccess
} from "../../lib/analytics/voiceFlow";

describe("voiceFlow analytics helpers", () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  it("emits voice funnel events without transcript contents", () => {
    const payload = { provider: "groq", durationSec: 12, questionId: "q1", chapterKey: "ch1" } as const;
    trackVoiceRecordStart(payload);
    trackVoiceRecordStop(payload);
    trackVoiceTranscribeStart(payload);
    trackVoiceTranscribeSuccess(payload);
    trackVoiceTranscribeError({ ...payload, error_code: "NETWORK" });
    trackVoiceTranscriptEdit(payload);
    trackVoiceAnswerConfirm(payload);

    expect(trackMock.mock.calls.map((call) => call[0])).toEqual([
      "voice_record_start",
      "voice_record_stop",
      "voice_transcribe_start",
      "voice_transcribe_success",
      "voice_transcribe_error",
      "voice_transcript_edit",
      "voice_answer_confirm"
    ]);

    for (const [, props] of trackMock.mock.calls) {
      expect(props).not.toHaveProperty("transcript");
      expect(props).not.toHaveProperty("transcriptText");
    }
  });
});

