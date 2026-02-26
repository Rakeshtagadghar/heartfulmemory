type VoiceErrorCode =
  | "MIC"
  | "MIC_PERMISSION_DENIED"
  | "MIC_NOT_FOUND"
  | "NETWORK"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_ERROR"
  | "UNSUPPORTED_MIME"
  | "UNSUPPORTED_BROWSER"
  | "INVALID_AUDIO"
  | "NOT_CONFIGURED"
  | "UNKNOWN";

function getFriendlyMessage(code?: string, fallback?: string | null) {
  switch (code as VoiceErrorCode | undefined) {
    case "MIC":
    case "MIC_PERMISSION_DENIED":
      return "Microphone access was denied. You can allow microphone access or switch to typing.";
    case "MIC_NOT_FOUND":
      return "No microphone was detected. Please check your device or use typing instead.";
    case "NETWORK":
      return "Network connection issue. Please try again or switch to typing.";
    case "PROVIDER_RATE_LIMIT":
      return "Transcription is busy right now. Please wait a moment and try again.";
    case "PROVIDER_TIMEOUT":
      return "Transcription took too long. You can retry transcription or record again.";
    case "PROVIDER_ERROR":
      return "Transcription service had a problem. Please try again or switch to typing.";
    case "UNSUPPORTED_MIME":
    case "UNSUPPORTED_BROWSER":
      return "Voice recording is not supported in this browser. Please use typing.";
    case "INVALID_AUDIO":
      return "The recording could not be processed. Please record again.";
    case "NOT_CONFIGURED":
      return "Voice transcription is not configured right now. Please use typing.";
    default:
      return fallback || "Something went wrong with voice input. You can retry or switch to typing.";
  }
}

export function VoiceErrors({
  code,
  message,
  onRetryTranscription,
  onRecordAgain,
  onSwitchToTyping
}: {
  code?: string | null;
  message?: string | null;
  onRetryTranscription?: () => void;
  onRecordAgain?: () => void;
  onSwitchToTyping: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4">
      <p className="text-sm font-semibold text-rose-100">Voice input needs attention</p>
      <p className="mt-2 text-sm leading-6 text-rose-100/90">{getFriendlyMessage(code ?? undefined, message)}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {onRetryTranscription ? (
          <button
            type="button"
            onClick={onRetryTranscription}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-white"
          >
            Retry Transcription
          </button>
        ) : null}
        {onRecordAgain ? (
          <button
            type="button"
            onClick={onRecordAgain}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-white"
          >
            Record Again
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSwitchToTyping}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-white"
        >
          Switch to Typing
        </button>
      </div>
    </div>
  );
}

