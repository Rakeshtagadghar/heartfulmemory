"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceVisualizer } from "react-voice-visualizer";
import type { TiptapDoc } from "../../../../../packages/shared/richtext/tiptapTypes";
import { extractPlainText } from "../../../../../packages/shared/richtext/extractPlainText";
import { appendTranscriptToDoc } from "../../../../../packages/editor/voice/appendTranscript";
import { blobToBase64 } from "../../../lib/audio/mediaRecorder";
import { transcribeViaApi } from "../../voice/VoiceRecorder";
import { acquireVoiceSession, releaseVoiceSession } from "../../../lib/voice/voiceSessionLock";
import { VoiceWaveform } from "../../voice/VoiceWaveform";
import { VoiceStatusPill } from "../../voice/VoiceStatusPill";
import { VoiceErrorCard, type VoiceErrorCardAction } from "../../voice/VoiceErrorCard";
import { MicHelpModal } from "../../voice/MicHelpModal";
import type { VoiceSessionState } from "../../voice/voiceStates";
import { getVoiceErrorCopy } from "../../../lib/voice/errors/voiceErrorCopy";
import { isMicSetupError, normalizeVoiceErrorCode, type VoiceErrorCode } from "../../../lib/voice/errors/voiceErrorCodes";
import { isVoicePreflightBlocking, useVoicePreflight } from "../../../lib/voice/preflight";
import {
  recordVoiceError,
  recordVoicePreflightFailed,
  recordVoiceRecorderState
} from "../../../lib/observability/voiceTelemetry";
import {
  trackVoiceRecordStart,
  trackVoiceRecordStop,
  trackVoiceTranscribeError,
  trackVoiceTranscribeStart,
  trackVoiceTranscribeSuccess
} from "../../../lib/analytics/voiceFlow";

type Props = {
  frameId: string;
  anchorBounds: { left: number; top: number; width: number; height: number };
  currentDoc: TiptapDoc | null;
  onTranscriptAppended: (newDoc: TiptapDoc, plainText: string) => void;
  onClose: () => void;
  storybookId: string;
  promptHint?: string;
};

export function StudioVoiceOverlay({
  frameId,
  anchorBounds,
  currentDoc,
  onTranscriptAppended,
  onClose,
  storybookId,
  promptHint
}: Props) {
  const MIN_RECORDING_MS = 700;
  const [sessionState, setSessionState] = useState<VoiceSessionState>("idle");
  const preflight = useVoicePreflight(true);
  const [errorCode, setErrorCode] = useState<VoiceErrorCode | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const recordStartTimeRef = useRef<number>(0);
  const closingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const stopRecordingRef = useRef<() => void>(() => undefined);
  const autoStartAttemptedRef = useRef(false);
  const stopFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const controls = useVoiceVisualizer({
    onStartRecording: () => {
      setSessionState("listening");
      recordStartTimeRef.current = Date.now();
      trackVoiceRecordStart({ context: "studio", nodeId: frameId, storybookId });
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
      surface: "studio",
      storybookId,
      nodeId: frameId
    });
    return normalized;
  }, [frameId, storybookId]);

  useEffect(() => {
    if (!recorderError) return;
    if (stopFallbackTimerRef.current) {
      clearTimeout(stopFallbackTimerRef.current);
      stopFallbackTimerRef.current = null;
    }
    releaseVoiceSession("studio");
    setVoiceError(recorderError, "MIC_CAPTURE_FAILED");
  }, [recorderError, setVoiceError]);

  const beginRecording = useCallback(async () => {
    setErrorCode(null);

    if (preflight && isVoicePreflightBlocking(preflight)) {
      if (preflight.code) {
        recordVoicePreflightFailed(preflight.code, {
          surface: "studio",
          storybookId,
          nodeId: frameId
        });
        setVoiceError(preflight.code, preflight.code);
      }
      return;
    }

    if (!acquireVoiceSession("studio")) {
      setVoiceError("MIC_IN_USE", "MIC_IN_USE");
      return;
    }

    try {
      await Promise.resolve(startRecording());
      recordVoiceRecorderState("start", {
        surface: "studio",
        storybookId,
        nodeId: frameId
      });
    } catch (error) {
      releaseVoiceSession("studio");
      setVoiceError(error, "MIC_CAPTURE_FAILED");
    }
  }, [frameId, preflight, setVoiceError, startRecording, storybookId]);

  // Auto-start recording on mount
  useEffect(() => {
    if (autoStartAttemptedRef.current) return;
    autoStartAttemptedRef.current = true;
    void beginRecording();
  }, [beginRecording]);

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
      releaseVoiceSession("studio");
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

  const runTranscription = useCallback(async (blob: Blob, durationMs: number) => {
    setErrorCode(null);
    setSessionState("processing");
    const durationSec = Math.max(1, Math.round(durationMs / 1000));
    trackVoiceTranscribeStart({ context: "studio", nodeId: frameId, storybookId });

    if (blob.size === 0 || durationMs < MIN_RECORDING_MS) {
      const code = setVoiceError("MIC_SILENT_AUDIO", "MIC_SILENT_AUDIO");
      trackVoiceTranscribeError({
        context: "studio",
        nodeId: frameId,
        storybookId,
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
        prompt: promptHint ? `Text frame context: ${promptHint}` : undefined
      });

      if (!result.ok) {
        const code = setVoiceError(result.errorCode, "STT_PROVIDER_ERROR");
        trackVoiceTranscribeError({
          context: "studio",
          nodeId: frameId,
          storybookId,
          error_code: code
        });
        return;
      }

      if (!result.transcriptText.trim()) {
        const code = setVoiceError("MIC_SILENT_AUDIO", "MIC_SILENT_AUDIO");
        trackVoiceTranscribeError({
          context: "studio",
          nodeId: frameId,
          storybookId,
          error_code: code
        });
        return;
      }

      // Append transcript to existing doc
      const baseDoc: TiptapDoc = currentDoc ?? { type: "doc", content: [] };
      const newDoc = appendTranscriptToDoc(baseDoc, result.transcriptText, "paragraph");
      const plainText = extractPlainText(newDoc);

      onTranscriptAppended(newDoc, plainText);
      setSessionState("success");
      trackVoiceTranscribeSuccess({
        context: "studio",
        nodeId: frameId,
        storybookId,
        durationSec
      });
      trackVoiceRecordStop({
        context: "studio",
        nodeId: frameId,
        storybookId,
        durationSec
      });
      recordVoiceRecorderState("stop", {
        surface: "studio",
        storybookId,
        nodeId: frameId
      });

      // Auto-close after success
      setTimeout(() => {
        if (!closingRef.current) {
          closingRef.current = true;
          onClose();
        }
      }, 1500);
    } catch (error) {
      const code = setVoiceError(error, "STT_NETWORK_ERROR");
      trackVoiceTranscribeError({
        context: "studio",
        nodeId: frameId,
        storybookId,
        error_code: code
      });
    }
  }, [MIN_RECORDING_MS, currentDoc, frameId, onClose, onTranscriptAppended, promptHint, setVoiceError, storybookId]);

  // Bridge: when the library produces a blob, run transcription
  useEffect(() => {
    if (!recordedBlob) return;
    const durationMs = Date.now() - recordStartTimeRef.current;
    if (stopFallbackTimerRef.current) {
      clearTimeout(stopFallbackTimerRef.current);
      stopFallbackTimerRef.current = null;
    }
    releaseVoiceSession("studio");
    globalThis.queueMicrotask(() => {
      void runTranscription(recordedBlob, durationMs);
    });
  }, [recordedBlob]); // eslint-disable-line react-hooks/exhaustive-deps

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
      releaseVoiceSession("studio");
      setVoiceError(error, "MIC_RECORDING_FAILED");
    }
  };

  const handleCancel = () => {
    if (isRecordingInProgress) {
      try {
        stopRecording();
      } catch {
        // ignore best-effort cancel
      }
    }
    closingRef.current = true;
    releaseVoiceSession("studio");
    onClose();
  };

  const handleRetry = async () => {
    if (recordedBlob && (errorCode === "STT_NETWORK_ERROR" || errorCode === "STT_PROVIDER_ERROR" || errorCode === "STT_TIMEOUT")) {
      const durationMs = Date.now() - recordStartTimeRef.current;
      await runTranscription(recordedBlob, durationMs);
      return;
    }

    clearCanvas();
    recordStartTimeRef.current = 0;
    setSessionState("idle");
    setErrorCode(null);
    await beginRecording();
  };

  // Position overlay below the frame anchor
  const overlayTop = anchorBounds.top + anchorBounds.height + 8;
  const overlayLeft = anchorBounds.left + anchorBounds.width / 2 - 140;
  const errorActions: VoiceErrorCardAction[] = [];

  if (sessionState === "error") {
    errorActions.push({
      label: errorCode ? getVoiceErrorCopy(errorCode).primaryActionLabel : "Try again",
      onClick: () => {
        void handleRetry();
      },
      variant: "primary"
    });
    if (errorCode && isMicSetupError(errorCode)) {
      errorActions.push({
        label: getVoiceErrorCopy(errorCode).helpActionLabel,
        onClick: () => setHelpOpen(true),
        variant: "ghost"
      });
    }
    errorActions.push({
      label: "Use typing instead",
      onClick: handleCancel,
      variant: "secondary"
    });
  }

  return (
    <div
      className="absolute z-50 w-[280px] rounded-2xl border border-white/15 bg-[#0e1520]/95 p-4 shadow-xl backdrop-blur-sm"
      style={{ left: Math.max(8, overlayLeft), top: overlayTop }}
    >
      <div className="mb-3 flex items-center justify-between">
        <VoiceStatusPill state={sessionState} />
        {sessionState === "listening" && (
          <span className="text-xs text-white/50">{formattedRecordingTime}</span>
        )}
        <button
          type="button"
          onClick={handleCancel}
          className="cursor-pointer text-xs text-white/40 transition hover:text-white/70"
        >
          Cancel
        </button>
      </div>

      <VoiceWaveform
        controls={controls}
        visible={isRecordingInProgress || isProcessingRecordedAudio}
        height={48}
      />

      {sessionState === "success" && (
        <p className="py-2 text-center text-xs text-emerald-300">Added to text box</p>
      )}

      {sessionState === "error" && (
        <VoiceErrorCard code={errorCode} actions={errorActions} className="py-0" />
      )}

      <div className="mt-3 flex gap-2">
        {sessionState === "listening" && (
          <button
            type="button"
            onClick={() => void handleStop()}
            className="flex-1 cursor-pointer rounded-xl border border-emerald-300/30 bg-emerald-500/20 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
          >
            Stop
          </button>
        )}
      </div>
      <MicHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
