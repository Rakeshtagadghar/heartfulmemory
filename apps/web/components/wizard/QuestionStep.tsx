"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Card } from "../ui/card";
import type { GuidedTemplateQuestion } from "../../../../packages/shared/templates/templateTypes";
import type { TiptapDoc } from "../../../../packages/shared/richtext/tiptapTypes";
import { getClientSttConfig } from "../../lib/config/stt";
import { VoiceAnswerPanel, maybeTrackVoiceTranscriptEdit } from "./VoiceAnswerPanel";
import { AINarratePanel } from "./AINarratePanel";
import { AnswerEditorTiptap, type AnswerEditorHandle } from "./AnswerEditorTiptap";

type CurrentAnswer = {
  answerText: string | null;
  answerRich?: TiptapDoc | null;
  skipped: boolean;
  source: "text" | "voice" | "ai_narrated";
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

type AnswerSource = "text" | "voice" | "ai_narrated";

type TrackArgs = {
  answerSource: AnswerSource;
  chapterKey: string;
  questionId: string;
  provider: "groq" | "elevenlabs" | null;
  hasTrackedEditRef: RefObject<boolean>;
  setAnswerSource: (v: AnswerSource) => void;
};

function tabBtnClass(active: boolean) {
  return `inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold ${active ? "border-gold/50 bg-gold/10 text-gold" : "border-white/10 text-white/60"}`;
}

function onEditorPlainTextChange(nextValue: string, args: TrackArgs) {
  if (args.answerSource === "voice") {
    maybeTrackVoiceTranscriptEdit({
      enabled: Boolean(nextValue),
      hasTrackedEditRef: args.hasTrackedEditRef,
      chapterKey: args.chapterKey,
      questionId: args.questionId,
      provider: args.provider
    });
  }
  if (args.answerSource === "ai_narrated") args.setAnswerSource("text");
}

export function QuestionStep({
  question,
  chapterKey,
  chapterTitle,
  stepIndex,
  totalSteps,
  currentAnswer,
  storybookId,
  chapterInstanceId
}: {
  question: GuidedTemplateQuestion;
  chapterKey: string;
  chapterTitle: string;
  stepIndex: number;
  totalSteps: number;
  currentAnswer: CurrentAnswer | null;
  storybookId: string;
  chapterInstanceId: string;
}) {
  const sttConfig = getClientSttConfig();
  const [mode, setMode] = useState<"voice" | "type">(
    sttConfig.enableVoiceInput ? "voice" : "type"
  );
  // Plain text mirrored from the Tiptap editor — used by AINarratePanel
  const [answerPlainText, setAnswerPlainText] = useState(currentAnswer?.answerText ?? "");
  const [answerSource, setAnswerSource] = useState<AnswerSource>(currentAnswer?.source ?? "text");
  const [sttMeta, setSttMeta] = useState<CurrentAnswer["sttMeta"]>(currentAnswer?.sttMeta ?? null);
  const [audioRef, setAudioRef] = useState<string | null>(currentAnswer?.audioRef ?? null);
  const voiceEditTrackedRef = useRef(false);
  const editorRef = useRef<AnswerEditorHandle | null>(null);

  const resumeInVoiceMode = currentAnswer?.source === "voice" && sttConfig.enableVoiceInput;
  useEffect(() => {
    if (!resumeInVoiceMode) return;
    const timer = globalThis.setTimeout(() => { setMode("voice"); }, 0);
    return () => { globalThis.clearTimeout(timer); };
  }, [resumeInVoiceMode]);

  const voiceSource: "text" | "voice" = answerSource === "ai_narrated" ? "text" : answerSource;
  const editorPlaceholder =
    mode === "voice" ? "Record to generate transcript, or type here…" : "Type your memory here…";

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
                className={tabBtnClass(mode === "voice")}
              >
                Voice
              </button>
              <button
                type="button"
                onClick={() => setMode("type")}
                className={tabBtnClass(mode === "type")}
              >
                Type
              </button>
            </div>

            {mode === "voice" ? (
              <VoiceAnswerPanel
                questionId={question.questionId}
                chapterKey={chapterKey}
                questionPrompt={question.prompt}
                setAnswerText={(value) => {
                  setAnswerPlainText(value);
                  editorRef.current?.replaceWithPlainText(value);
                }}
                source={voiceSource}
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
          <span className="block text-sm font-semibold text-white/85">
            {answerSource === "voice" ? "Transcript (editable)" : "Your answer"}
          </span>
          <AnswerEditorTiptap
            ref={editorRef}
            storybookId={storybookId}
            chapterInstanceId={chapterInstanceId}
            questionId={question.questionId}
            initialContent={currentAnswer?.answerRich ?? null}
            initialPlainText={currentAnswer?.answerText ?? null}
            placeholder={editorPlaceholder}
            onPlainTextChange={(text) => {
              setAnswerPlainText(text);
              onEditorPlainTextChange(text, {
                answerSource,
                chapterKey,
                questionId: question.questionId,
                provider: sttMeta?.provider ?? null,
                hasTrackedEditRef: voiceEditTrackedRef,
                setAnswerSource
              });
            }}
          />
          <AINarratePanel
            answerText={answerPlainText}
            questionPrompt={question.prompt}
            chapterTitle={chapterTitle}
            onAccept={(narratedText) => {
              setAnswerPlainText(narratedText);
              setAnswerSource("ai_narrated");
              editorRef.current?.replaceWithPlainText(narratedText);
            }}
          />
          <p className="text-xs text-white/55">
            To continue, enter an answer and click <span className="font-semibold text-white/70">Next</span>.
          </p>
        </div>

        <input type="hidden" name="answerSource" value={answerSource} />
        <input type="hidden" name="answerAudioRef" value={audioRef ?? ""} />
        <input type="hidden" name="answerSttMetaJson" value={sttMeta ? JSON.stringify(sttMeta) : ""} />
      </div>
    </Card>
  );
}
