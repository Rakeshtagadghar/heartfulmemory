export type VoiceRecorderState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "processing_upload"
  | "transcribing"
  | "reviewing"
  | "error";

export type VoiceRecorderEvent =
  | { type: "REQUEST_PERMISSION" }
  | { type: "PERMISSION_GRANTED" }
  | { type: "PERMISSION_DENIED"; message: string }
  | { type: "START_RECORDING" }
  | { type: "STOP_RECORDING" }
  | { type: "UPLOAD_PROCESSING" }
  | { type: "TRANSCRIBE_START" }
  | { type: "TRANSCRIBE_SUCCESS" }
  | { type: "TRANSCRIBE_ERROR"; message: string }
  | { type: "RESET" }
  | { type: "RECORD_AGAIN" };

export type VoiceRecorderMachine = {
  state: VoiceRecorderState;
  errorMessage: string | null;
};

export const initialVoiceRecorderMachine: VoiceRecorderMachine = {
  state: "idle",
  errorMessage: null
};

export function voiceRecorderReducer(
  current: VoiceRecorderMachine,
  event: VoiceRecorderEvent
): VoiceRecorderMachine {
  switch (event.type) {
    case "REQUEST_PERMISSION":
      return { state: "requesting_permission", errorMessage: null };
    case "PERMISSION_GRANTED":
      return { state: "idle", errorMessage: null };
    case "PERMISSION_DENIED":
      return { state: "error", errorMessage: event.message };
    case "START_RECORDING":
      return { state: "recording", errorMessage: null };
    case "STOP_RECORDING":
      return { state: "processing_upload", errorMessage: null };
    case "UPLOAD_PROCESSING":
      return { state: "processing_upload", errorMessage: null };
    case "TRANSCRIBE_START":
      return { state: "transcribing", errorMessage: null };
    case "TRANSCRIBE_SUCCESS":
      return { state: "reviewing", errorMessage: null };
    case "TRANSCRIBE_ERROR":
      return { state: "error", errorMessage: event.message };
    case "RECORD_AGAIN":
      return { state: "idle", errorMessage: null };
    case "RESET":
      return { state: "idle", errorMessage: null };
    default:
      return current;
  }
}

