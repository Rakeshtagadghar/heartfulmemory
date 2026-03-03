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
import type { VoiceSessionState } from "../../voice/voiceStates";
import { getFriendlyVoiceError } from "../../../lib/voice/voiceErrorCodes";
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
  const [sessionState, setSessionState] = useState<VoiceSessionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recordStartTimeRef = useRef<number>(0);
  const closingRef = useRef(false);

  const controls = useVoiceVisualizer({
    onStartRecording: () => {
      setSessionState("listening");
      recordStartTimeRef.current = Date.now();
      trackVoiceRecordStart({ context: "studio", nodeId: frameId, storybookId });
    },
    onStopRecording: () => {
      // recordedBlob effect handles next steps
    }
  });

  const {
    startRecording,
    stopRecording,
    recordedBlob,
    isRecordingInProgress,
    formattedRecordingTime
  } = controls;

  // Auto-start recording on mount
  useEffect(() => {
    if (!acquireVoiceSession("studio")) {
      globalThis.queueMicrotask(() => {
        setErrorMessage(getFriendlyVoiceError("SESSION_LOCKED"));
        setSessionState("error");
      });
      return;
    }
    try {
      startRecording();
    } catch {
      releaseVoiceSession("studio");
      globalThis.queueMicrotask(() => {
        setErrorMessage(getFriendlyVoiceError("UNKNOWN"));
        setSessionState("error");
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseVoiceSession("studio");
    };
  }, []);

  const runTranscription = useCallback(async (blob: Blob, durationMs: number) => {
    setErrorMessage(null);
    setSessionState("processing");
    const durationSec = Math.max(1, Math.round(durationMs / 1000));
    trackVoiceTranscribeStart({ context: "studio", nodeId: frameId, storybookId });

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
        setErrorMessage(result.message);
        setSessionState("error");
        trackVoiceTranscribeError({
          context: "studio",
          nodeId: frameId,
          storybookId,
          error_code: result.errorCode
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

      // Auto-close after success
      setTimeout(() => {
        if (!closingRef.current) {
          closingRef.current = true;
          onClose();
        }
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transcription failed.";
      setErrorMessage(message);
      setSessionState("error");
      trackVoiceTranscribeError({
        context: "studio",
        nodeId: frameId,
        storybookId,
        error_code: "UNKNOWN"
      });
    }
  }, [currentDoc, frameId, onClose, onTranscriptAppended, promptHint, storybookId]);

  // Bridge: when the library produces a blob, run transcription
  useEffect(() => {
    if (!recordedBlob) return;
    const durationMs = Date.now() - recordStartTimeRef.current;
    globalThis.queueMicrotask(() => {
      void runTranscription(recordedBlob, durationMs);
    });
  }, [recordedBlob]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStop = () => {
    stopRecording();
  };

  const handleCancel = () => {
    if (isRecordingInProgress) {
      stopRecording();
    }
    closingRef.current = true;
    releaseVoiceSession("studio");
    onClose();
  };

  const handleRetry = async () => {
    const blob = recordedBlob;
    if (!blob) return;
    const durationMs = Date.now() - recordStartTimeRef.current;
    await runTranscription(blob, durationMs);
  };

  // Position overlay below the frame anchor
  const overlayTop = anchorBounds.top + anchorBounds.height + 8;
  const overlayLeft = anchorBounds.left + anchorBounds.width / 2 - 140;

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
        visible={sessionState === "listening"}
        height={48}
      />

      {sessionState === "success" && (
        <p className="py-2 text-center text-xs text-emerald-300">Added to text box</p>
      )}

      {sessionState === "error" && (
        <div className="space-y-2 py-2">
          <p className="text-xs text-rose-300">{errorMessage ?? "Something went wrong."}</p>
          <button
            type="button"
            onClick={() => void handleRetry()}
            disabled={!recordedBlob}
            className="cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/5 disabled:opacity-40"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {sessionState === "listening" && (
          <button
            type="button"
            onClick={handleStop}
            className="flex-1 cursor-pointer rounded-xl border border-emerald-300/30 bg-emerald-500/20 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
