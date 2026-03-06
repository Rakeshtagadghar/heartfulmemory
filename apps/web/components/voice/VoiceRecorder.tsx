"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVoiceVisualizer } from "react-voice-visualizer";
import { getClientSttConfig } from "../../lib/config/stt";
import { useVoiceConsent } from "../../lib/consent/useVoiceConsent";
import { storeOrDiscardAudioForVoiceAnswer } from "../../lib/audio/audioStorage";
import { blobToBase64 } from "../../lib/audio/mediaRecorder";
import { acquireVoiceSession, releaseVoiceSession } from "../../lib/voice/voiceSessionLock";
import { normalizeVoiceErrorCode, type VoiceErrorCode } from "../../lib/voice/errors/voiceErrorCodes";
import { getVoiceErrorCopy } from "../../lib/voice/errors/voiceErrorCopy";
import { isVoicePreflightBlocking, useVoicePreflight } from "../../lib/voice/preflight";
import {
  recordVoiceError,
  recordVoicePreflightFailed,
  recordVoiceRecorderState
} from "../../lib/observability/voiceTelemetry";
import { VoiceConsent } from "./VoiceConsent";
import { VoiceErrors } from "./VoiceErrors";
import { VoiceWaveform } from "./VoiceWaveform";
import { VoiceStatusPill } from "./VoiceStatusPill";
import { MicHelpModal } from "./MicHelpModal";
import { MicAvailabilityBadge } from "./MicAvailabilityBadge";
import type { VoiceSessionState } from "./voiceStates";
import {
  trackVoiceRecordStart,
  trackVoiceRecordStop,
  trackVoiceTranscribeError,
  trackVoiceTranscribeStart,
  trackVoiceTranscribeSuccess
} from "../../lib/analytics/voiceFlow";

type SttMeta = {
  provider: "groq" | "elevenlabs";
  confidence?: number | null;
  durationMs?: number | null;
  providerRequestId?: string | null;
  mimeType?: string | null;
  bytes?: number | null;
};

type VoiceTranscribeApiResult =
  | {
    ok: true;
    provider: "groq" | "elevenlabs";
    transcriptText: string;
    confidence: number | null;
    durationMs: number | null;
    providerRequestId: string | null;
    raw: Record<string, unknown> | null;
  }
  | {
    ok: false;
    errorCode: string;
    message: string;
    retryable: boolean;
  };

export async function transcribeViaApi(input: {
  audioBase64: string;
  mimeType: string;
  durationMs?: number;
  provider?: "groq" | "elevenlabs";
  prompt?: string | null;
}) {
  try {
    const response = await fetch("/api/stt/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const data = (await response.json()) as VoiceTranscribeApiResult | { ok: false; error: string };
    if (!response.ok) {
      const fallbackCode =
        response.status === 408 || response.status === 504
          ? "STT_TIMEOUT"
          : response.status >= 500
            ? "STT_PROVIDER_ERROR"
            : "STT_NETWORK_ERROR";
      return {
        ok: false as const,
        errorCode: normalizeVoiceErrorCode(
          "errorCode" in data && typeof data.errorCode === "string" ? data.errorCode : null,
          fallbackCode
        ),
        message: "Request failed before transcription could start.",
        retryable: true
      };
    }
    if ("error" in data && data.ok === false) {
      return {
        ok: false as const,
        errorCode: normalizeVoiceErrorCode(data.error, "UNKNOWN_ERROR"),
        message: data.error,
        retryable: true
      };
    }
    return data;
  } catch {
    return {
      ok: false as const,
      errorCode: "STT_NETWORK_ERROR",
      message: "Network connection issue during transcription.",
      retryable: true
    };
  }
}

export type { SttMeta, VoiceTranscribeApiResult };

export function VoiceRecorder({
  questionId,
  chapterKey,
  promptHint,
  onTranscriptReady,
  onSwitchToTyping
}: {
  questionId: string;
  chapterKey: string;
  promptHint?: string;
  onTranscriptReady: (payload: {
    transcriptText: string;
    sttMeta: SttMeta;
    audioRef: string | null;
    provider: "groq" | "elevenlabs";
    durationSec: number;
  }) => void;
  onSwitchToTyping: () => void;
}) {
  const MIN_RECORDING_MS = 700;
  const sttConfig = useMemo(() => getClientSttConfig(), []);
  const consent = useVoiceConsent();
  const [sessionState, setSessionState] = useState<VoiceSessionState>("idle");
  const preflight = useVoicePreflight(sttConfig.enableVoiceInput);
  const [errorCode, setErrorCode] = useState<VoiceErrorCode | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [lastTranscription, setLastTranscription] = useState<{
    transcriptText: string;
    provider: "groq" | "elevenlabs";
  } | null>(null);
  const recordStartTimeRef = useRef<number>(0);
  const isRecordingRef = useRef(false);
  const stopRecordingRef = useRef<() => void>(() => undefined);
  const stopFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxMs = sttConfig.maxSecondsPerAnswer * 1000;

  const controls = useVoiceVisualizer({
    onStartRecording: () => {
      setSessionState("listening");
      setLastTranscription(null);
      recordStartTimeRef.current = Date.now();
      trackVoiceRecordStart({ questionId, chapterKey });
    },
    onStopRecording: () => {
      setSessionState("processing");
    }
  });

  const {
    startRecording,
    stopRecording,
    recordedBlob,
    mediaRecorder,
    error: recorderError,
    isRecordingInProgress,
    isProcessingRecordedAudio,
    recordingTime,
    formattedRecordingTime,
    clearCanvas
  } = controls;

  useEffect(() => {
    isRecordingRef.current = isRecordingInProgress;
  }, [isRecordingInProgress]);

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  useEffect(() => {
    if (!isRecordingInProgress && stopFallbackTimerRef.current) {
      clearTimeout(stopFallbackTimerRef.current);
      stopFallbackTimerRef.current = null;
    }
  }, [isRecordingInProgress]);

  const setVoiceError = useCallback((value: unknown, fallbackCode: VoiceErrorCode) => {
    const normalized = normalizeVoiceErrorCode(value, fallbackCode);
    setErrorCode(normalized);
    setSessionState("error");
    recordVoiceError(normalized, {
      surface: "wizard",
      questionId,
      chapterKey
    });
    return normalized;
  }, [chapterKey, questionId]);

  useEffect(() => {
    if (!recorderError) return;
    if (stopFallbackTimerRef.current) {
      clearTimeout(stopFallbackTimerRef.current);
      stopFallbackTimerRef.current = null;
    }
    releaseVoiceSession("wizard");
    setVoiceError(recorderError, "MIC_CAPTURE_FAILED");
  }, [recorderError, setVoiceError]);

  const runTranscription = useCallback(async (
    blob: Blob,
    durationMs: number
  ) => {
    setErrorCode(null);
    setSessionState("processing");
    const durationSec = Math.max(1, Math.round(durationMs / 1000));
    trackVoiceTranscribeStart({
      provider: sttConfig.providerDefault,
      durationSec,
      questionId,
      chapterKey
    });

    if (blob.size === 0 || durationMs < MIN_RECORDING_MS) {
      const code = setVoiceError("MIC_SILENT_AUDIO", "MIC_SILENT_AUDIO");
      trackVoiceTranscribeError({
        provider: sttConfig.providerDefault,
        durationSec,
        questionId,
        chapterKey,
        error_code: code
      });
      return;
    }

    try {
      const audioBase64 = await blobToBase64(blob);
      const mimeType = blob.type || "audio/webm";
      const result = await transcribeViaApi({
        audioBase64,
        mimeType,
        durationMs,
        provider: sttConfig.providerDefault,
        prompt: promptHint ? `Question context: ${promptHint}` : undefined
      });

      if (!result.ok) {
        const code = setVoiceError(result.errorCode, "STT_PROVIDER_ERROR");
        trackVoiceTranscribeError({
          provider: sttConfig.providerDefault,
          durationSec,
          questionId,
          chapterKey,
          error_code: code
        });
        return;
      }

      if (!result.transcriptText.trim()) {
        const code = setVoiceError("MIC_SILENT_AUDIO", "MIC_SILENT_AUDIO");
        trackVoiceTranscribeError({
          provider: sttConfig.providerDefault,
          durationSec,
          questionId,
          chapterKey,
          error_code: code
        });
        return;
      }

      const storage = await storeOrDiscardAudioForVoiceAnswer(blob);
      const sttMeta: SttMeta = {
        provider: result.provider,
        confidence: result.confidence,
        durationMs: result.durationMs ?? durationMs,
        providerRequestId: result.providerRequestId,
        mimeType: blob.type || "audio/webm",
        bytes: blob.size
      };

      onTranscriptReady({
        transcriptText: result.transcriptText,
        sttMeta,
        audioRef: storage.audioRef,
        provider: result.provider,
        durationSec
      });
      setLastTranscription({
        transcriptText: result.transcriptText,
        provider: result.provider
      });
      setSessionState("success");
      trackVoiceTranscribeSuccess({
        provider: result.provider,
        durationSec,
        questionId,
        chapterKey
      });
    } catch (error) {
      const code = setVoiceError(error, "STT_NETWORK_ERROR");
      trackVoiceTranscribeError({
        provider: sttConfig.providerDefault,
        durationSec,
        questionId,
        chapterKey,
        error_code: code
      });
    }
  }, [MIN_RECORDING_MS, chapterKey, onTranscriptReady, promptHint, questionId, setVoiceError, sttConfig.providerDefault]);

  // Bridge: when the library produces a blob, run transcription
  useEffect(() => {
    if (!recordedBlob) return;
    const durationMs = Date.now() - recordStartTimeRef.current;
    if (stopFallbackTimerRef.current) {
      clearTimeout(stopFallbackTimerRef.current);
      stopFallbackTimerRef.current = null;
    }
    releaseVoiceSession("wizard");
    recordVoiceRecorderState("stop", {
      surface: "wizard",
      questionId,
      chapterKey
    });
    trackVoiceRecordStop({
      questionId,
      chapterKey,
      durationSec: Math.max(1, Math.round(durationMs / 1000)),
      auto_stop: false
    });
    globalThis.queueMicrotask(() => {
      void runTranscription(recordedBlob, durationMs);
    });
  }, [recordedBlob]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-stop at max duration
  useEffect(() => {
    if (!isRecordingInProgress) return;
    if (recordingTime >= maxMs) {
      stopRecording();
    }
  }, [recordingTime, maxMs, isRecordingInProgress, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stopFallbackTimerRef.current) {
        clearTimeout(stopFallbackTimerRef.current);
      }
      if (isRecordingRef.current) {
        try {
          stopRecordingRef.current();
        } catch {
          // ignore best-effort cleanup
        }
      }
      releaseVoiceSession("wizard");
    };
  }, []);

  const forceStopActiveRecorder = useCallback(() => {
    const activeRecorder = mediaRecorder;
    if (!activeRecorder || activeRecorder.state === "inactive") return;
    try {
      activeRecorder.stop();
    } catch {
      // ignore and still stop tracks below
    }
    try {
      activeRecorder.stream.getTracks().forEach((track) => track.stop());
    } catch {
      // ignore
    }
  }, [mediaRecorder]);

  const beginRecording = async () => {
    setErrorCode(null);

    if (preflight && isVoicePreflightBlocking(preflight)) {
      if (preflight.code) {
        recordVoicePreflightFailed(preflight.code, {
          surface: "wizard",
          questionId,
          chapterKey
        });
        setVoiceError(preflight.code, preflight.code);
      }
      return;
    }

    if (!acquireVoiceSession("wizard")) {
      setVoiceError("MIC_IN_USE", "MIC_IN_USE");
      return;
    }

    try {
      await Promise.resolve(startRecording());
      recordVoiceRecorderState("start", {
        surface: "wizard",
        questionId,
        chapterKey
      });
    } catch (error) {
      releaseVoiceSession("wizard");
      setVoiceError(error, "MIC_CAPTURE_FAILED");
    }
  };

  const handleStop = async () => {
    setSessionState("processing");
    try {
      await Promise.resolve(stopRecording());
      stopFallbackTimerRef.current = setTimeout(() => {
        forceStopActiveRecorder();
      }, 250);
    } catch (error) {
      if (stopFallbackTimerRef.current) {
        clearTimeout(stopFallbackTimerRef.current);
        stopFallbackTimerRef.current = null;
      }
      releaseVoiceSession("wizard");
      setVoiceError(error, "MIC_RECORDING_FAILED");
    }
  };

  const retryTranscription = async () => {
    const blob = recordedBlob;
    if (!blob) return;
    const durationMs = Date.now() - recordStartTimeRef.current;
    await runTranscription(blob, durationMs);
  };

  const recordAgain = () => {
    clearCanvas();
    recordStartTimeRef.current = 0;
    setLastTranscription(null);
    setErrorCode(null);
    setSessionState("idle");
  };

  if (!sttConfig.enableVoiceInput) {
    return (
      <VoiceErrors
        code="VOICE_NOT_CONFIGURED"
        onSwitchToTyping={onSwitchToTyping}
      />
    );
  }

  if (!consent.isLoaded || !consent.hasConsent) {
    return <VoiceConsent onAccept={consent.grantConsent} />;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <VoiceStatusPill state={sessionState} />
          <p className="text-sm font-semibold text-white/90">Voice Answer</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/85">
          {formattedRecordingTime}
        </div>
      </div>

      <MicAvailabilityBadge
        preflight={preflight}
        onOpenMicHelp={() => setHelpOpen(true)}
      />

      <VoiceWaveform
        controls={controls}
        visible={isRecordingInProgress || isProcessingRecordedAudio}
      />

      {sessionState === "error" ? (
        <VoiceErrors
          code={errorCode}
          onRetryTranscription={recordedBlob ? retryTranscription : undefined}
          onRecordAgain={recordAgain}
          onSwitchToTyping={onSwitchToTyping}
          onOpenMicHelp={() => setHelpOpen(true)}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {!isRecordingInProgress ? (
          <button
            type="button"
            onClick={() => void beginRecording()}
            disabled={sessionState === "processing" || isProcessingRecordedAudio || isVoicePreflightBlocking(preflight)}
            title={isVoicePreflightBlocking(preflight) && preflight?.code ? getVoiceErrorCopy(preflight.code).title : undefined}
            className="inline-flex h-14 cursor-pointer items-center justify-center rounded-2xl border border-rose-300/30 bg-rose-400/15 px-5 text-base font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleStop()}
            className="inline-flex h-14 cursor-pointer items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-5 text-base font-semibold text-emerald-100"
          >
            Stop Recording
          </button>
        )}

        <button
          type="button"
          onClick={recordAgain}
          disabled={isRecordingInProgress || isProcessingRecordedAudio || sessionState === "processing"}
          className="inline-flex h-14 cursor-pointer items-center justify-center rounded-2xl border border-white/15 px-5 text-sm font-semibold text-white/75 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Record Again
        </button>

        <button
          type="button"
          onClick={() => void retryTranscription()}
          disabled={!recordedBlob || isRecordingInProgress || isProcessingRecordedAudio || sessionState === "processing"}
          className="inline-flex h-14 cursor-pointer items-center justify-center rounded-2xl border border-white/15 px-5 text-sm font-semibold text-white/75 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Retry Transcription
        </button>
      </div>

      {lastTranscription ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">Last transcript preview</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/75">{lastTranscription.transcriptText}</p>
        </div>
      ) : null}
      <MicHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
