"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "../ui/card";
import type { GuidedTemplateQuestion } from "../../../../packages/shared/templates/templateTypes";
import { getClientSttConfig } from "../../lib/config/stt";
import { VoiceAnswerPanel, maybeTrackVoiceTranscriptEdit } from "./VoiceAnswerPanel";

type CurrentAnswer = {
  answerText: string | null;
  skipped: boolean;
  source: "text" | "voice";
  sttMeta: {
    provider: "groq" | "elevenlabs";
    confidence?: number | null;
    durationMs?: number | null;
    providerRequestId?: string | null;
    mimeType?: string | null;
    bytes?: number | null;
  } | null;
  audioRef: string | null;
};

export function QuestionStep({
  question,
  chapterKey,
  stepIndex,
  totalSteps,
  currentAnswer
}: {
  question: GuidedTemplateQuestion;
  chapterKey: string;
  stepIndex: number;
  totalSteps: number;
  currentAnswer: CurrentAnswer | null;
}) {
  const sttConfig = getClientSttConfig();
  const [mode, setMode] = useState<"voice" | "type">(
    sttConfig.enableVoiceInput ? "voice" : "type"
  );
  const [answerText, setAnswerText] = useState(currentAnswer?.answerText ?? "");
  const [answerSource, setAnswerSource] = useState<"text" | "voice">(currentAnswer?.source ?? "text");
  const [sttMeta, setSttMeta] = useState<CurrentAnswer["sttMeta"]>(currentAnswer?.sttMeta ?? null);
  const [audioRef, setAudioRef] = useState<string | null>(currentAnswer?.audioRef ?? null);
  const voiceEditTrackedRef = useRef(false);

  useEffect(() => {
    if (currentAnswer?.source !== "voice" || !sttConfig.enableVoiceInput) return;
    const timer = globalThis.setTimeout(() => {
      setMode("voice");
    }, 0);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [currentAnswer?.source, sttConfig.enableVoiceInput]);

  return (
    <Card className="p-5 sm:p-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            Question {stepIndex + 1} of {totalSteps}
          </span>
          {question.required ? (
            <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100">
              Required
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Optional
            </span>
          )}
          {currentAnswer?.skipped ? (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Previously Skipped
            </span>
          ) : null}
        </div>

        <div>
          <h2 className="text-2xl font-semibold leading-tight text-parchment sm:text-3xl">
            {question.prompt}
          </h2>
          {question.helpText ? (
            <p className="mt-3 text-sm leading-7 text-white/70">{question.helpText}</p>
          ) : null}
        </div>

        {sttConfig.enableVoiceInput ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.015] p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("voice")}
                className={`inline-flex h-11 items-center justify-center rounded-xl border text-sm font-semibold ${
                  mode === "voice"
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-white/10 text-white/60"
                }`}
              >
                Voice
              </button>
              <button
                type="button"
                onClick={() => setMode("type")}
                className={`inline-flex h-11 items-center justify-center rounded-xl border text-sm font-semibold ${
                  mode === "type"
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-white/10 text-white/60"
                }`}
              >
                Type
              </button>
            </div>

            {mode === "voice" ? (
              <VoiceAnswerPanel
                questionId={question.questionId}
                chapterKey={chapterKey}
                questionPrompt={question.prompt}
                setAnswerText={setAnswerText}
                source={answerSource}
                setSource={setAnswerSource}
                sttMeta={sttMeta}
                setSttMeta={setSttMeta}
                setAudioRef={setAudioRef}
                onSwitchToTyping={() => setMode("type")}
              />
            ) : null}
          </div>
        ) : null}

        <div className="space-y-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/85">
              {answerSource === "voice" ? "Transcript (editable)" : "Your answer"}
            </span>
            <textarea
              name="answerText"
              value={answerText}
              onChange={(event) => {
                const nextValue = event.target.value;
                setAnswerText(nextValue);
                if (answerSource === "voice") {
                  maybeTrackVoiceTranscriptEdit({
                    enabled: true,
                    hasTrackedEditRef: voiceEditTrackedRef,
                    chapterKey,
                    questionId: question.questionId,
                    provider: sttMeta?.provider ?? null
                  });
                }
              }}
              rows={7}
              className="w-full rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3 text-base leading-7 text-white outline-none placeholder:text-white/35 focus:border-gold/45"
              placeholder={mode === "voice" ? "Record to generate transcript, or type here..." : "Type your memory here..."}
            />
          </label>
          <p className="text-xs text-white/55">
            To continue, enter an answer or use <span className="font-semibold text-white/70">Skip</span>.
          </p>
        </div>

        <input type="hidden" name="answerSource" value={answerSource} />
        <input type="hidden" name="answerAudioRef" value={audioRef ?? ""} />
        <input type="hidden" name="answerSttMetaJson" value={sttMeta ? JSON.stringify(sttMeta) : ""} />
      </div>
    </Card>
  );
}
