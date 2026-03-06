export const VOICE_ERROR_CODES = [
  "MIC_PERMISSION_DENIED",
  "MIC_PERMISSION_DISMISSED",
  "MIC_NOT_FOUND",
  "MIC_IN_USE",
  "MIC_INSECURE_CONTEXT",
  "MIC_UNSUPPORTED_BROWSER",
  "MIC_CAPTURE_FAILED",
  "MIC_SILENT_AUDIO",
  "MIC_RECORDING_FAILED",
  "STT_NETWORK_ERROR",
  "STT_PROVIDER_ERROR",
  "STT_TIMEOUT",
  "UNKNOWN_ERROR",
  "VOICE_NOT_CONFIGURED"
] as const;

export type VoiceErrorCode = (typeof VOICE_ERROR_CODES)[number];

const DIRECT_CODES = new Set<string>(VOICE_ERROR_CODES);

const LEGACY_CODE_MAP: Record<string, VoiceErrorCode> = {
  MIC: "MIC_PERMISSION_DENIED",
  MIC_PERMISSION_DENIED: "MIC_PERMISSION_DENIED",
  MIC_PERMISSION_DISMISSED: "MIC_PERMISSION_DISMISSED",
  MIC_NOT_FOUND: "MIC_NOT_FOUND",
  MIC_IN_USE: "MIC_IN_USE",
  MIC_INSECURE_CONTEXT: "MIC_INSECURE_CONTEXT",
  MIC_UNSUPPORTED_BROWSER: "MIC_UNSUPPORTED_BROWSER",
  MIC_CAPTURE_FAILED: "MIC_CAPTURE_FAILED",
  MIC_SILENT_AUDIO: "MIC_SILENT_AUDIO",
  MIC_RECORDING_FAILED: "MIC_RECORDING_FAILED",
  UNSUPPORTED_BROWSER: "MIC_UNSUPPORTED_BROWSER",
  UNSUPPORTED_MIME: "MIC_UNSUPPORTED_BROWSER",
  START_FAILED: "MIC_CAPTURE_FAILED",
  STOP_FAILED: "MIC_RECORDING_FAILED",
  EMPTY_AUDIO: "MIC_SILENT_AUDIO",
  INVALID_AUDIO: "MIC_CAPTURE_FAILED",
  SESSION_LOCKED: "MIC_IN_USE",
  NETWORK: "STT_NETWORK_ERROR",
  STT_NETWORK_ERROR: "STT_NETWORK_ERROR",
  PROVIDER_RATE_LIMIT: "STT_PROVIDER_ERROR",
  PROVIDER_TIMEOUT: "STT_TIMEOUT",
  PROVIDER_ERROR: "STT_PROVIDER_ERROR",
  STT_PROVIDER_ERROR: "STT_PROVIDER_ERROR",
  STT_TIMEOUT: "STT_TIMEOUT",
  NOT_CONFIGURED: "VOICE_NOT_CONFIGURED",
  VOICE_NOT_CONFIGURED: "VOICE_NOT_CONFIGURED",
  UNKNOWN: "UNKNOWN_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
};

function extractErrorMessage(input: unknown) {
  if (input instanceof Error) return input.message;
  if (typeof input === "string") return input;
  if (typeof input === "object" && input && "message" in input && typeof input.message === "string") {
    return input.message;
  }
  return "";
}

function normalizeFromMessage(message: string): VoiceErrorCode | null {
  const lower = message.toLowerCase();

  if (!lower) return null;

  if (
    lower.includes("dismiss") ||
    lower.includes("cancel") ||
    lower.includes("closed the request")
  ) {
    return "MIC_PERMISSION_DISMISSED";
  }
  if (
    lower.includes("secure context") ||
    lower.includes("insecure") ||
    lower.includes("https")
  ) {
    return "MIC_INSECURE_CONTEXT";
  }
  if (
    lower.includes("another application") ||
    lower.includes("already in use") ||
    lower.includes("device in use") ||
    lower.includes("track start error") ||
    lower.includes("could not start audio source") ||
    lower.includes("session locked")
  ) {
    return "MIC_IN_USE";
  }
  if (
    lower.includes("permission") ||
    lower.includes("notallowed") ||
    lower.includes("denied")
  ) {
    return "MIC_PERMISSION_DENIED";
  }
  if (
    lower.includes("not found") ||
    lower.includes("no microphone") ||
    lower.includes("no audio input") ||
    lower.includes("device not found") ||
    lower.includes("notfounderror")
  ) {
    return "MIC_NOT_FOUND";
  }
  if (
    lower.includes("unsupported") ||
    lower.includes("mediarecorder") ||
    lower.includes("getusermedia") ||
    lower.includes("mime")
  ) {
    return "MIC_UNSUPPORTED_BROWSER";
  }
  if (
    lower.includes("silent") ||
    lower.includes("no speech") ||
    lower.includes("empty transcript") ||
    lower.includes("couldn't hear") ||
    lower.includes("could not hear")
  ) {
    return "MIC_SILENT_AUDIO";
  }
  if (lower.includes("timeout") || lower.includes("taking too long") || lower.includes("aborted")) {
    return "STT_TIMEOUT";
  }
  if (
    lower.includes("network") ||
    lower.includes("offline") ||
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch")
  ) {
    return "STT_NETWORK_ERROR";
  }
  if (
    lower.includes("rate limit") ||
    lower.includes("provider") ||
    lower.includes("service unavailable") ||
    lower.includes("too many requests") ||
    lower.includes("status 429") ||
    lower.includes("status 5")
  ) {
    return "STT_PROVIDER_ERROR";
  }
  if (
    lower.includes("stop failed") ||
    lower.includes("recording failed") ||
    lower.includes("failed to stop")
  ) {
    return "MIC_RECORDING_FAILED";
  }
  if (
    lower.includes("capture") ||
    lower.includes("could not start") ||
    lower.includes("unable to access microphone") ||
    lower.includes("notreadableerror") ||
    lower.includes("failed to start")
  ) {
    return "MIC_CAPTURE_FAILED";
  }
  if (lower.includes("not configured") || lower.includes("disabled")) {
    return "VOICE_NOT_CONFIGURED";
  }

  return null;
}

export function normalizeVoiceErrorCode(
  input: unknown,
  fallbackCode: VoiceErrorCode = "UNKNOWN_ERROR"
): VoiceErrorCode {
  if (typeof input === "string") {
    if (DIRECT_CODES.has(input)) return input as VoiceErrorCode;
    const mapped = LEGACY_CODE_MAP[input];
    if (mapped) return mapped;
  }

  const message = extractErrorMessage(input);
  if (message) {
    const direct = LEGACY_CODE_MAP[message];
    if (direct) return direct;
    const inferred = normalizeFromMessage(message);
    if (inferred) return inferred;
  }

  return fallbackCode;
}

export function isMicSetupError(code: VoiceErrorCode | string | null | undefined) {
  const normalized = normalizeVoiceErrorCode(code ?? null);
  return new Set<VoiceErrorCode>([
    "MIC_PERMISSION_DENIED",
    "MIC_PERMISSION_DISMISSED",
    "MIC_NOT_FOUND",
    "MIC_IN_USE",
    "MIC_INSECURE_CONTEXT",
    "MIC_UNSUPPORTED_BROWSER",
    "MIC_CAPTURE_FAILED",
    "MIC_RECORDING_FAILED"
  ]).has(normalized);
}

export function isRetryableVoiceError(code: VoiceErrorCode | string | null | undefined) {
  const normalized = normalizeVoiceErrorCode(code ?? null);
  return new Set<VoiceErrorCode>([
    "MIC_PERMISSION_DISMISSED",
    "MIC_CAPTURE_FAILED",
    "MIC_RECORDING_FAILED",
    "MIC_SILENT_AUDIO",
    "STT_NETWORK_ERROR",
    "STT_PROVIDER_ERROR",
    "STT_TIMEOUT",
    "UNKNOWN_ERROR"
  ]).has(normalized);
}
