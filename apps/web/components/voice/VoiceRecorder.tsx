"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVoiceVisualizer } from "react-voice-visualizer";
import { getClientSttConfig } from "../../lib/config/stt";
import { useVoiceConsent } from "../../lib/consent/useVoiceConsent";
import { storeOrDiscardAudioForVoiceAnswer } from "../../lib/audio/audioStorage";
import { blobToBase64 } from "../../lib/audio/mediaRecorder";
import { acquireVoiceSession, releaseVoiceSession } from "../../lib/voice/voiceSessionLock";
import { VoiceConsent } from "./VoiceConsent";
import { VoiceErrors } from "./VoiceErrors";
import { VoiceWaveform } from "./VoiceWaveform";
import { VoiceStatusPill } from "./VoiceStatusPill";
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
      return {
        ok: false as const,
        errorCode: "NETWORK",
        message: "Request failed before transcription could start.",
        retryable: true
      };
    }
    if ("error" in data && data.ok === false) {
      return {
        ok: false as const,
        errorCode: "UNKNOWN",
        message: data.error,
        retryable: true
      };
    }
    return data;
  } catch {
    return {
      ok: false as const,
      errorCode: "NETWORK",
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
  const sttConfig = useMemo(() => getClientSttConfig(), []);
  const consent = useVoiceConsent();
  const [sessionState, setSessionState] = useState<VoiceSessionState>("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastTranscription, setLastTranscription] = useState<{
    transcriptText: string;
    provider: "groq" | "elevenlabs";
  } | null>(null);
  const recordStartTimeRef = useRef<number>(0);

  const maxMs = sttConfig.maxSecondsPerAnswer * 1000;

  const controls = useVoiceVisualizer({
    onStartRecording: () => {
      setSessionState("listening");
      setLastTranscription(null);
      recordStartTimeRef.current = Date.now();
      trackVoiceRecordStart({ questionId, chapterKey });
    },
    onStopRecording: () => {
      // recordedBlob useEffect handles next steps
    }
  });

  const {
    startRecording,
    stopRecording,
    recordedBlob,
    isRecordingInProgress,
    recordingTime,
    formattedRecordingTime,
    clearCanvas
  } = controls;

  const runTranscription = useCallback(async (
    blob: Blob,
    durationMs: number
  ) => {
    setErrorCode(null);
    setErrorMessage(null);
    setSessionState("processing");
    const durationSec = Math.max(1, Math.round(durationMs / 1000));
    trackVoiceTranscribeStart({
      provider: sttConfig.providerDefault,
      durationSec,
      questionId,
      chapterKey
    });

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
        setErrorCode(result.errorCode);
        setErrorMessage(result.message);
        setSessionState("error");
        trackVoiceTranscribeError({
          provider: sttConfig.providerDefault,
          durationSec,
          questionId,
          chapterKey,
          error_code: result.errorCode
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
      const message = error instanceof Error ? error.message : "Transcription failed.";
      setErrorCode("UNKNOWN");
      setErrorMessage(message);
      setSessionState("error");
      trackVoiceTranscribeError({
        provider: sttConfig.providerDefault,
        durationSec,
        questionId,
        chapterKey,
        error_code: "UNKNOWN"
      });
    }
  }, [chapterKey, onTranscriptReady, promptHint, questionId, sttConfig.providerDefault]);

  // Bridge: when the library produces a blob, run transcription
  useEffect(() => {
    if (!recordedBlob) return;
    const durationMs = Date.now() - recordStartTimeRef.current;
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
      releaseVoiceSession("wizard");
    };
  }, []);

  const beginRecording = async () => {
    setErrorCode(null);
    setErrorMessage(null);

    if (!acquireVoiceSession("wizard")) {
      setErrorCode("SESSION_LOCKED");
      setErrorMessage("Voice recording is already active in another section.");
      setSessionState("error");
      return;
    }

    try {
      startRecording();
    } catch (error) {
      releaseVoiceSession("wizard");
      const message = error instanceof Error ? error.message : "Unable to start recording.";
      setErrorCode("UNKNOWN");
      setErrorMessage(message);
      setSessionState("error");
    }
  };

  const handleStop = () => {
    stopRecording();
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
    setErrorMessage(null);
    setSessionState("idle");
  };

  if (!sttConfig.enableVoiceInput) {
    return (
      <VoiceErrors
        code="NOT_CONFIGURED"
        message="Voice input is currently disabled."
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

      <VoiceWaveform
        controls={controls}
        visible={sessionState === "listening"}
      />

      {sessionState === "error" ? (
        <VoiceErrors
          code={errorCode}
          message={errorMessage}
          onRetryTranscription={recordedBlob ? retryTranscription : undefined}
          onRecordAgain={recordAgain}
          onSwitchToTyping={onSwitchToTyping}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {!isRecordingInProgress ? (
          <button
            type="button"
            onClick={() => void beginRecording()}
            disabled={sessionState === "processing"}
            className="inline-flex h-14 cursor-pointer items-center justify-center rounded-2xl border border-rose-300/30 bg-rose-400/15 px-5 text-base font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex h-14 cursor-pointer items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-5 text-base font-semibold text-emerald-100"
          >
            Stop Recording
          </button>
        )}

        <button
          type="button"
          onClick={recordAgain}
          disabled={isRecordingInProgress || sessionState === "processing"}
          className="inline-flex h-14 cursor-pointer items-center justify-center rounded-2xl border border-white/15 px-5 text-sm font-semibold text-white/75 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Record Again
        </button>

        <button
          type="button"
          onClick={() => void retryTranscription()}
          disabled={!recordedBlob || isRecordingInProgress || sessionState === "processing"}
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
    </div>
  );
}
