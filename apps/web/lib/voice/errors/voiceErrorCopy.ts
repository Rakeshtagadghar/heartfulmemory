import {
  normalizeVoiceErrorCode,
  type VoiceErrorCode
} from "./voiceErrorCodes";

export type VoiceErrorCopy = {
  title: string;
  description: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  helpActionLabel: string;
};

export const VOICE_ERROR_COPY: Record<VoiceErrorCode, VoiceErrorCopy> = {
  MIC_PERMISSION_DENIED: {
    title: "Turn on microphone access",
    description: "Your browser blocked the microphone. Allow access in browser settings, then try again or keep typing.",
    primaryActionLabel: "Try again",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "How to enable mic"
  },
  MIC_PERMISSION_DISMISSED: {
    title: "Microphone request was closed",
    description: "No microphone access was granted yet. Open the microphone request again, or keep typing for now.",
    primaryActionLabel: "Try again",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "How to enable mic"
  },
  MIC_NOT_FOUND: {
    title: "No microphone detected",
    description: "We could not find a microphone on this device. Connect one, pick the right input, or keep typing instead.",
    primaryActionLabel: "Try again",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Check microphone setup"
  },
  MIC_IN_USE: {
    title: "Finish the current recording first",
    description: "Another recording is already active, or your microphone is busy in another app. Finish that recording, then try again.",
    primaryActionLabel: "Try again",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Fix microphone access"
  },
  MIC_INSECURE_CONTEXT: {
    title: "Microphone needs a secure page",
    description: "Microphone recording works only on a secure page. Open the app over HTTPS or on localhost, or keep typing instead.",
    primaryActionLabel: "Try again",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Open browser steps"
  },
  MIC_UNSUPPORTED_BROWSER: {
    title: "This browser cannot record audio here",
    description: "Voice recording is not available in this browser. Try Chrome, Edge, or Safari, or keep typing instead.",
    primaryActionLabel: "Try again",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Browser help"
  },
  MIC_CAPTURE_FAILED: {
    title: "We could not start the microphone",
    description: "The microphone did not start correctly. Check access, close other apps using the mic, and try again.",
    primaryActionLabel: "Try again",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Fix microphone access"
  },
  MIC_SILENT_AUDIO: {
    title: "We could not hear anything yet",
    description: "Try speaking a little longer and a little closer to the microphone, or keep typing instead.",
    primaryActionLabel: "Record again",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Microphone tips"
  },
  MIC_RECORDING_FAILED: {
    title: "The recording could not finish cleanly",
    description: "Please try recording again. If this keeps happening, close other apps using the mic or keep typing instead.",
    primaryActionLabel: "Record again",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Fix microphone access"
  },
  STT_NETWORK_ERROR: {
    title: "Connection problem during transcription",
    description: "The recording was captured, but we could not reach the transcription service. Try again, or keep typing instead.",
    primaryActionLabel: "Retry transcription",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Microphone tips"
  },
  STT_PROVIDER_ERROR: {
    title: "Transcription is busy right now",
    description: "The transcription service had a temporary problem. Please retry in a moment, or keep typing instead.",
    primaryActionLabel: "Retry transcription",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Microphone tips"
  },
  STT_TIMEOUT: {
    title: "Transcription is taking too long",
    description: "Please retry transcription, or record again if needed. You can also keep typing instead.",
    primaryActionLabel: "Retry transcription",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Microphone tips"
  },
  UNKNOWN_ERROR: {
    title: "Voice input needs attention",
    description: "Something went wrong with voice input. Please try again, or keep typing instead.",
    primaryActionLabel: "Try again",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Microphone tips"
  },
  VOICE_NOT_CONFIGURED: {
    title: "Voice input is not available here",
    description: "Voice transcription is turned off right now. You can continue by typing instead.",
    primaryActionLabel: "Use typing instead",
    secondaryActionLabel: "Use typing instead",
    helpActionLabel: "Microphone tips"
  }
};

export function getVoiceErrorCopy(code: VoiceErrorCode | string | null | undefined) {
  return VOICE_ERROR_COPY[normalizeVoiceErrorCode(code ?? null)];
}

export function getFriendlyVoiceError(code: VoiceErrorCode | string | null | undefined) {
  return getVoiceErrorCopy(code).description;
}
