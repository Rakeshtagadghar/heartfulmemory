"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { getClientSttConfig } from "../../lib/config/stt";
import { useVoiceConsent } from "../../lib/consent/useVoiceConsent";
import { storeOrDiscardAudioForVoiceAnswer } from "../../lib/audio/audioStorage";
import {
  blobToBase64,
  createBrowserRecordingSession,
  MediaRecorderClientError
} from "../../lib/audio/mediaRecorder";
import {
  initialVoiceRecorderMachine,
  voiceRecorderReducer
} from "./recorderStateMachine";
import { VoiceConsent } from "./VoiceConsent";
import { VoiceErrors } from "./VoiceErrors";
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

function formatTimer(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function transcribeViaApi(input: {
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
  const [machine, dispatch] = useReducer(voiceRecorderReducer, initialVoiceRecorderMachine);
  const [timerMs, setTimerMs] = useState(0);
  const [lastRecording, setLastRecording] = useState<{
    blob: Blob;
    mimeType: string;
    durationMs: number;
  } | null>(null);
  const [lastTranscription, setLastTranscription] = useState<{
    transcriptText: string;
    provider: "groq" | "elevenlabs";
  } | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const recorderRef = useRef<Awaited<ReturnType<typeof createBrowserRecordingSession>> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const maxMs = sttConfig.maxSecondsPerAnswer * 1000;

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
      void recorderRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (machine.state !== "recording") return;
    timerIntervalRef.current = window.setInterval(() => {
      const startedAt = startedAtRef.current;
      if (!startedAt) return;
      const elapsed = Date.now() - startedAt;
      setTimerMs(elapsed);
      if (elapsed >= maxMs) {
        void stopRecording(true);
      }
    }, 250);

    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [machine.state, maxMs]);

  const resetError = () => {
    setErrorCode(null);
  };

  const beginRecording = async () => {
    resetError();
    dispatch({ type: "REQUEST_PERMISSION" });
    try {
      const recorder = await createBrowserRecordingSession();
      recorderRef.current = recorder;
      dispatch({ type: "PERMISSION_GRANTED" });
      await recorder.start();
      startedAtRef.current = Date.now();
      setTimerMs(0);
      setLastTranscription(null);
      dispatch({ type: "START_RECORDING" });
      trackVoiceRecordStart({ questionId, chapterKey });
    } catch (error) {
      const code =
        error instanceof MediaRecorderClientError
          ? error.code
          : "UNKNOWN";
      setErrorCode(code);
      dispatch({
        type: "PERMISSION_DENIED",
        message: error instanceof Error ? error.message : "Unable to start recording."
      });
    }
  };

  const runTranscription = async (
    recording: { blob: Blob; mimeType: string; durationMs: number },
    opts?: { retry?: boolean }
  ) => {
    resetError();
    dispatch({ type: "TRANSCRIBE_START" });
    const durationSec = Math.max(1, Math.round(recording.durationMs / 1000));
    trackVoiceTranscribeStart({
      provider: sttConfig.providerDefault,
      durationSec,
      questionId,
      chapterKey
    });

    try {
      const audioBase64 = await blobToBase64(recording.blob);
      const result = await transcribeViaApi({
        audioBase64,
        mimeType: recording.mimeType,
        durationMs: recording.durationMs,
        provider: sttConfig.providerDefault,
        prompt: promptHint ? `Question context: ${promptHint}` : undefined
      });

      if (!result.ok) {
        setErrorCode(result.errorCode);
        dispatch({ type: "TRANSCRIBE_ERROR", message: result.message });
        trackVoiceTranscribeError({
          provider: sttConfig.providerDefault,
          durationSec,
          questionId,
          chapterKey,
          error_code: result.errorCode
        });
        return;
      }

      const storage = await storeOrDiscardAudioForVoiceAnswer(recording.blob);
      const sttMeta: SttMeta = {
        provider: result.provider,
        confidence: result.confidence,
        durationMs: result.durationMs ?? recording.durationMs,
        providerRequestId: result.providerRequestId,
        mimeType: recording.mimeType,
        bytes: recording.blob.size
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
      dispatch({ type: "TRANSCRIBE_SUCCESS" });
      trackVoiceTranscribeSuccess({
        provider: result.provider,
        durationSec,
        questionId,
        chapterKey
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transcription failed.";
      setErrorCode("UNKNOWN");
      dispatch({ type: "TRANSCRIBE_ERROR", message });
      trackVoiceTranscribeError({
        provider: sttConfig.providerDefault,
        durationSec,
        questionId,
        chapterKey,
        error_code: "UNKNOWN"
      });
    }
  };

  const stopRecording = async (autoStopped = false) => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    dispatch({ type: "STOP_RECORDING" });
    try {
      const result = await recorder.stop();
      recorderRef.current = null;
      const recording = {
        blob: result.blob,
        mimeType: recorder.mimeType,
        durationMs: result.durationMs
      };
      setLastRecording(recording);
      trackVoiceRecordStop({
        questionId,
        chapterKey,
        durationSec: Math.max(1, Math.round(result.durationMs / 1000)),
        auto_stop: autoStopped
      });
      await runTranscription(recording);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not stop recording.";
      setErrorCode(error instanceof MediaRecorderClientError ? error.code : "UNKNOWN");
      dispatch({ type: "TRANSCRIBE_ERROR", message });
    }
  };

  const retryTranscription = async () => {
    if (!lastRecording) return;
    await runTranscription(lastRecording, { retry: true });
  };

  const recordAgain = async () => {
    await recorderRef.current?.cancel();
    recorderRef.current = null;
    startedAtRef.current = null;
    setTimerMs(0);
    setLastRecording(null);
    setLastTranscription(null);
    setErrorCode(null);
    dispatch({ type: "RECORD_AGAIN" });
  };

  const stateLabel = (() => {
    switch (machine.state) {
      case "requesting_permission":
        return "Requesting microphone permission...";
      case "recording":
        return "Recording...";
      case "processing_upload":
        return "Preparing audio...";
      case "transcribing":
        return "Transcribing your voice...";
      case "reviewing":
        return "Transcript ready. Review and edit it below.";
      case "error":
        return "Voice input error";
      default:
        return "Ready to record";
    }
  })();

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
        <div>
          <p className="text-sm font-semibold text-white/90">Voice Answer</p>
          <p className="text-xs text-white/60">{stateLabel}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/85">
          {formatTimer(timerMs)}
        </div>
      </div>

      {machine.state === "error" ? (
        <VoiceErrors
          code={errorCode}
          message={machine.errorMessage}
          onRetryTranscription={lastRecording ? retryTranscription : undefined}
          onRecordAgain={recordAgain}
          onSwitchToTyping={onSwitchToTyping}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {machine.state !== "recording" ? (
          <button
            type="button"
            onClick={beginRecording}
            className="inline-flex h-14 items-center justify-center rounded-2xl border border-rose-300/30 bg-rose-400/15 px-5 text-base font-semibold text-rose-100"
          >
            Start Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void stopRecording(false)}
            className="inline-flex h-14 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-5 text-base font-semibold text-emerald-100"
          >
            Stop Recording
          </button>
        )}

        <button
          type="button"
          onClick={recordAgain}
          className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/15 px-5 text-sm font-semibold text-white/75"
        >
          Record Again
        </button>

        <button
          type="button"
          onClick={retryTranscription}
          disabled={!lastRecording || machine.state === "recording" || machine.state === "transcribing"}
          className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/15 px-5 text-sm font-semibold text-white/75 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Retry Transcription
        </button>

        <button
          type="button"
          onClick={onSwitchToTyping}
          className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/15 px-5 text-sm font-semibold text-white/75"
        >
          Switch to Typing
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
