import { describe, expect, it } from "vitest";
import {
  initialVoiceRecorderMachine,
  voiceRecorderReducer
} from "../../components/voice/recorderStateMachine";

describe("voiceRecorderReducer", () => {
  it("transitions through record and transcribe success flow", () => {
    let state = initialVoiceRecorderMachine;
    state = voiceRecorderReducer(state, { type: "REQUEST_PERMISSION" });
    expect(state.state).toBe("requesting_permission");
    state = voiceRecorderReducer(state, { type: "PERMISSION_GRANTED" });
    expect(state.state).toBe("idle");
    state = voiceRecorderReducer(state, { type: "START_RECORDING" });
    expect(state.state).toBe("recording");
    state = voiceRecorderReducer(state, { type: "STOP_RECORDING" });
    expect(state.state).toBe("processing_upload");
    state = voiceRecorderReducer(state, { type: "TRANSCRIBE_START" });
    expect(state.state).toBe("transcribing");
    state = voiceRecorderReducer(state, { type: "TRANSCRIBE_SUCCESS" });
    expect(state.state).toBe("reviewing");
  });

  it("captures error state and resets", () => {
    let state = initialVoiceRecorderMachine;
    state = voiceRecorderReducer(state, { type: "TRANSCRIBE_ERROR", message: "Provider timeout" });
    expect(state.state).toBe("error");
    expect(state.errorMessage).toContain("timeout");
    state = voiceRecorderReducer(state, { type: "RESET" });
    expect(state.state).toBe("idle");
    expect(state.errorMessage).toBeNull();
  });
});

