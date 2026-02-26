"use client";

import { useState } from "react";
import { VoiceRecorder } from "../voice/VoiceRecorder";
import { trackVoiceAnswerConfirm, trackVoiceTranscriptEdit } from "../../lib/analytics/voiceFlow";

type VoiceMeta = {
  provider: "groq" | "elevenlabs";
  confidence?: number | null;
  durationMs?: number | null;
  providerRequestId?: string | null;
  mimeType?: string | null;
  bytes?: number | null;
} | null;

export function VoiceAnswerPanel({
  questionId,
  chapterKey,
  questionPrompt,
  setAnswerText,
  source,
  setSource,
  sttMeta,
  setSttMeta,
  setAudioRef,
  onSwitchToTyping
}: {
  questionId: string;
  chapterKey: string;
  questionPrompt: string;
  setAnswerText: (value: string) => void;
  source: "text" | "voice";
  setSource: (value: "text" | "voice") => void;
  sttMeta: VoiceMeta;
  setSttMeta: (value: VoiceMeta) => void;
  setAudioRef: (value: string | null) => void;
  onSwitchToTyping: () => void;
}) {
  const [latestTranscript, setLatestTranscript] = useState<{
    transcriptText: string;
    sttMeta: Exclude<VoiceMeta, null>;
    audioRef: string | null;
    provider: "groq" | "elevenlabs";
    durationSec: number;
  } | null>(null);

  return (
    <div className="space-y-3">
      <VoiceRecorder
        questionId={questionId}
        chapterKey={chapterKey}
        promptHint={questionPrompt}
        onSwitchToTyping={onSwitchToTyping}
        onTranscriptReady={({ transcriptText, sttMeta, audioRef, provider, durationSec }) => {
          const payload = {
            transcriptText,
            sttMeta,
            audioRef,
            provider,
            durationSec
          } as const;
          setLatestTranscript(payload);
          setAnswerText(transcriptText);
          setSource("voice");
          setSttMeta(sttMeta);
          setAudioRef(audioRef);

          trackVoiceAnswerConfirm({
            provider,
            durationSec,
            questionId,
            chapterKey
          });
        }}
      />

      {latestTranscript ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              setAnswerText(latestTranscript.transcriptText);
              setSource("voice");
              setSttMeta(latestTranscript.sttMeta);
              setAudioRef(latestTranscript.audioRef);
            }}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gold/35 bg-gold/10 px-4 text-sm font-semibold text-gold"
          >
            Use Transcript
          </button>
          <span className="text-xs text-white/55">Transcript is also auto-filled after transcription.</span>
        </div>
      ) : null}

      {source === "voice" && sttMeta ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-white/60">
          <p>
            Transcribed with <span className="font-semibold text-white/80">{sttMeta.provider}</span>
            {typeof sttMeta.durationMs === "number"
              ? ` - ${Math.max(1, Math.round(sttMeta.durationMs / 1000))}s`
              : ""}
          </p>
          <p className="mt-1">You can edit the transcript in the answer box before saving.</p>
        </div>
      ) : null}

      {source === "voice" ? (
        <button
          type="button"
          onClick={() => {
            setSource("text");
            setSttMeta(null);
            setAudioRef(null);
            onSwitchToTyping();
          }}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/70"
        >
          Use typing instead
        </button>
      ) : null}
    </div>
  );
}

export function maybeTrackVoiceTranscriptEdit(params: {
  enabled: boolean;
  hasTrackedEditRef: { current: boolean };
  chapterKey: string;
  questionId: string;
  provider?: string | null;
}) {
  if (!params.enabled || params.hasTrackedEditRef.current) return;
  params.hasTrackedEditRef.current = true;
  trackVoiceTranscriptEdit({
    chapterKey: params.chapterKey,
    questionId: params.questionId,
    provider: params.provider ?? undefined
  });
}

