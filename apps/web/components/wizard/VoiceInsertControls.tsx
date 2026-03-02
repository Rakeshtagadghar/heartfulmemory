"use client";

/**
 * VoiceInsertControls
 *
 * Provides insert-mode controls for injecting STT transcript text into a
 * Tiptap AnswerEditor. Rendered next to (or below) the VoiceRecorder widget.
 *
 * Modes:
 *   - replace: Replaces the entire editor content with the transcript
 *   - append:  Appends the transcript as a new paragraph at the end
 */

import type { AnswerEditorHandle } from "./AnswerEditorTiptap";
import type { RefObject } from "react";

export type VoiceInsertMode = "replace" | "append";

type Props = {
  transcript: string;
  editorRef: RefObject<AnswerEditorHandle | null>;
  onInserted?: (mode: VoiceInsertMode) => void;
};

const BTN =
  "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition";

export function VoiceInsertControls({ transcript, editorRef, onInserted }: Props) {
  if (!transcript.trim()) return null;

  function handleReplace() {
    editorRef.current?.replaceWithPlainText(transcript);
    onInserted?.("replace");
  }

  function handleAppend() {
    editorRef.current?.appendPlainText(transcript);
    onInserted?.("append");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleReplace}
        className={`${BTN} border-gold/35 bg-gold/10 text-gold hover:bg-gold/20`}
      >
        Replace answer
      </button>
      <button
        type="button"
        onClick={handleAppend}
        className={`${BTN} border-white/15 text-white/70 hover:bg-white/[0.05]`}
      >
        Append to answer
      </button>
    </div>
  );
}
