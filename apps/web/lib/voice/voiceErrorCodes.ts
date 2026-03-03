/**
 * Stable error codes for voice recording failures.
 * Used for Sentry tagging and user-facing messages.
 */
export type VoiceErrorCode =
  | "MIC_PERMISSION_DENIED"
  | "MIC_NOT_FOUND"
  | "UNSUPPORTED_BROWSER"
  | "UNSUPPORTED_MIME"
  | "EMPTY_AUDIO"
  | "SESSION_LOCKED"
  | "NETWORK"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_ERROR"
  | "NOT_CONFIGURED"
  | "UNKNOWN";

const FRIENDLY_MESSAGES: Record<VoiceErrorCode, string> = {
  MIC_PERMISSION_DENIED: "Microphone permission was denied. Please allow access in your browser settings.",
  MIC_NOT_FOUND: "No microphone found. Please connect a microphone and try again.",
  UNSUPPORTED_BROWSER: "Your browser does not support voice recording.",
  UNSUPPORTED_MIME: "Audio format not supported. Please try a different browser.",
  EMPTY_AUDIO: "No audio was captured. Please speak louder and try again.",
  SESSION_LOCKED: "Voice recording is already active in another section.",
  NETWORK: "Network connection issue. Please check your connection and try again.",
  PROVIDER_RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
  PROVIDER_TIMEOUT: "Transcription took too long. Please try again.",
  PROVIDER_ERROR: "Transcription service error. Please try again.",
  NOT_CONFIGURED: "Voice input is currently disabled.",
  UNKNOWN: "Something went wrong. Please try again."
};

export function getFriendlyVoiceError(code: VoiceErrorCode | string | null): string {
  if (!code) return FRIENDLY_MESSAGES.UNKNOWN;
  return FRIENDLY_MESSAGES[code as VoiceErrorCode] ?? FRIENDLY_MESSAGES.UNKNOWN;
}
