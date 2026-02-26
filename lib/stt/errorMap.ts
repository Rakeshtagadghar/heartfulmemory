export type SttErrorCode =
  | "MIC"
  | "NETWORK"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_ERROR"
  | "UNSUPPORTED_MIME"
  | "INVALID_AUDIO"
  | "NOT_CONFIGURED"
  | "UNKNOWN";

export type SttMappedError = {
  code: SttErrorCode;
  message: string;
  retryable: boolean;
};

export function mapSttError(error: unknown): SttMappedError {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown STT error");
  const lower = message.toLowerCase();

  if (lower.includes("permission") || lower.includes("mic")) {
    return { code: "MIC", message, retryable: false };
  }
  if (lower.includes("unsupported mime") || lower.includes("mime")) {
    return { code: "UNSUPPORTED_MIME", message, retryable: false };
  }
  if (lower.includes("not configured") || lower.includes("missing api key")) {
    return { code: "NOT_CONFIGURED", message, retryable: false };
  }
  if (lower.includes("timeout") || lower.includes("aborted")) {
    return { code: "PROVIDER_TIMEOUT", message, retryable: true };
  }
  if (lower.includes("rate limit") || lower.includes("429")) {
    return { code: "PROVIDER_RATE_LIMIT", message, retryable: true };
  }
  if (lower.includes("network") || lower.includes("fetch failed") || lower.includes("offline")) {
    return { code: "NETWORK", message, retryable: true };
  }
  if (lower.includes("invalid audio") || lower.includes("empty audio")) {
    return { code: "INVALID_AUDIO", message, retryable: false };
  }
  if (lower.includes("provider")) {
    return { code: "PROVIDER_ERROR", message, retryable: true };
  }
  return { code: "UNKNOWN", message, retryable: true };
}

