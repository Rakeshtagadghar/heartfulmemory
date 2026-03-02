"use client";

import { useCallback, useRef, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { getClientSttConfig } from "../../lib/config/stt";
import { VoiceAnswerPanel } from "./VoiceAnswerPanel";
import { AINarratePanel } from "./AINarratePanel";
import { AnswerEditorTiptap, type AnswerEditorHandle } from "./AnswerEditorTiptap";

type VoiceMeta = {
  provider: "groq" | "elevenlabs";
  confidence?: number | null;
  durationMs?: number | null;
  providerRequestId?: string | null;
  mimeType?: string | null;
  bytes?: number | null;
} | null;

function tabBtnClass(active: boolean) {
  return `inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold ${active ? "border-gold/50 bg-gold/10 text-gold" : "border-white/10 text-white/60"}`;
}

export function ExtraQuestionStep({
  storybookId,
  storybookTitle,
  defaultText,
  saveAction,
  skipAction
}: {
  storybookId: string;
  storybookTitle: string;
  defaultText?: string | null;
  saveAction: (text: string) => Promise<void>;
  skipAction: () => Promise<void>;
}) {
  const sttConfig = getClientSttConfig();
  const [mode, setMode] = useState<"voice" | "type">(
    sttConfig.enableVoiceInput ? "voice" : "type"
  );
  const [answerPlainText, setAnswerPlainText] = useState(defaultText ?? "");
  const [answerSource, setAnswerSource] = useState<"text" | "voice">("text");
  const [sttMeta, setSttMeta] = useState<VoiceMeta>(null);
  const [audioRef, setAudioRef] = useState<string | null>(null);
  const editorRef = useRef<AnswerEditorHandle | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questionPrompt = "Do you want to add any more information or memories?";
  const editorPlaceholder =
    mode === "voice"
      ? "Record to generate transcript, or type here…"
      : "Share anything you'd like included in your story…";

  const doAutosave = useCallback(
    async (text: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/extra/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storybookId, text })
        });
        const data = (await res.json()) as { ok: boolean };
        setSaveStatus(data.ok ? "saved" : "error");
        if (data.ok) {
          setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
        }
      } catch {
        setSaveStatus("error");
      }
    },
    [storybookId]
  );

  function handlePlainTextChange(text: string) {
    setAnswerPlainText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void doAutosave(text);
    }, 700);
  }

  async function handleSave() {
    const trimmed = editorRef.current?.getPlainText().trim() ?? "";
    if (!trimmed) {
      setError("Please write something or tap Skip for now.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveAction(trimmed);
    } catch {
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    setError(null);
    try {
      await skipAction();
    } catch {
      setError("Could not skip. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">One more thing</p>
        <h1 className="mt-2 font-display text-2xl text-parchment sm:text-3xl">{storybookTitle}</h1>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Optional
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-semibold leading-tight text-parchment sm:text-3xl">
              {questionPrompt}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Anything that matters — even if it doesn&apos;t fit a specific question.
            </p>
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
                  questionId="q_extra"
                  chapterKey="extra"
                  questionPrompt={questionPrompt}
                  setAnswerText={(value) => {
                    setAnswerPlainText(value);
                    editorRef.current?.replaceWithPlainText(value);
                    void doAutosave(value);
                  }}
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
            <span className="block text-sm font-semibold text-white/85">
              {answerSource === "voice" ? "Transcript (editable)" : "Your answer"}
            </span>
            <AnswerEditorTiptap
              ref={editorRef}
              storybookId={storybookId}
              chapterInstanceId=""
              questionId="q_extra"
              initialContent={null}
              initialPlainText={defaultText ?? null}
              placeholder={editorPlaceholder}
              disableAutosave
              onPlainTextChange={handlePlainTextChange}
            />
            <AINarratePanel
              answerText={answerPlainText}
              questionPrompt={questionPrompt}
              chapterTitle={storybookTitle}
              onAccept={(narratedText) => {
                setAnswerPlainText(narratedText);
                editorRef.current?.replaceWithPlainText(narratedText);
                void doAutosave(narratedText);
              }}
            />
            {saveStatus === "saving" && (
              <p className="text-xs text-white/40">Saving…</p>
            )}
            {saveStatus === "saved" && (
              <p className="text-xs text-emerald-400/70">Saved</p>
            )}
            {saveStatus === "error" && (
              <p className="text-xs text-rose-400/70">Save failed — will retry on next change</p>
            )}
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          ) : null}
        </div>
      </Card>

      <Card className="sticky bottom-3 z-10 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleSkip}
            disabled={saving}
          >
            Skip for now
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save & Continue"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
