"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import type { TiptapDoc } from "../../../../packages/shared/richtext/tiptapTypes";
import { extractPlainText } from "../../../../packages/shared/richtext/extractPlainText";
import { plainTextToTiptapDoc } from "../../../../packages/shared/richtext/normalize";
import { AnswerToolbar } from "./AnswerToolbar";

export interface AnswerEditorHandle {
  /** Replace all content with plain text (wrapped in paragraphs). */
  replaceWithPlainText: (text: string) => void;
  /** Append plain text as a new paragraph at the end. */
  appendPlainText: (text: string) => void;
  /** Get current plain text value. */
  getPlainText: () => string;
}

type Props = {
  storybookId: string;
  chapterInstanceId: string;
  questionId: string;
  /** Tiptap JSON – canonical initial content. Takes precedence over initialPlainText. */
  initialContent: TiptapDoc | null;
  /** Fallback plain text (legacy answerText); migrated to Tiptap doc on first render. */
  initialPlainText: string | null;
  /** Placeholder shown when the editor is empty. */
  placeholder?: string;
  /** Hidden input for plain text (read by server action). */
  answerTextInputName?: string;
  /** Hidden input for rich JSON (read by server action). */
  answerRichJsonInputName?: string;
  /** Called whenever the plain text representation changes. */
  onPlainTextChange?: (text: string) => void;
  /** When true, skip autosave and hide save-status indicators. */
  disableAutosave?: boolean;
};

function resolveInitialDoc(
  rich: TiptapDoc | null,
  plain: string | null
): TiptapDoc {
  if (rich && rich.type === "doc") return rich;
  if (plain) return plainTextToTiptapDoc(plain);
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export const AnswerEditorTiptap = forwardRef<AnswerEditorHandle, Props>(
  function AnswerEditorTiptap(
    {
      storybookId,
      chapterInstanceId,
      questionId,
      initialContent,
      initialPlainText,
      placeholder = "Type your memory here…",
      answerTextInputName = "answerText",
      answerRichJsonInputName = "answerRichJson",
      onPlainTextChange,
      disableAutosave = false
    },
    ref
  ) {
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const answerTextInputRef = useRef<HTMLInputElement | null>(null);
    const answerRichJsonInputRef = useRef<HTMLInputElement | null>(null);

    const initialDoc = resolveInitialDoc(initialContent, initialPlainText);
    const initialPlainResolved = extractPlainText(initialDoc);

    const editor = useEditor(
      {
        immediatelyRender: false, // Safe for Next.js SSR
        extensions: [
          StarterKit.configure({ link: { openOnClick: false } }),
          Placeholder.configure({ placeholder }),
          TextAlign.configure({ types: ["heading", "paragraph"] }),
          TextStyle,
          Color,
          Superscript,
          Subscript
        ],
        content: initialDoc,
        onUpdate({ editor: ed }) {
          const doc = ed.getJSON() as TiptapDoc;
          const plain = extractPlainText(doc);
          syncHiddenInputs(doc, plain);
          onPlainTextChange?.(plain);
          scheduleAutosave(doc, plain);
        },
        onBlur({ editor: ed }) {
          if (disableAutosave) return;
          const doc = ed.getJSON() as TiptapDoc;
          const plain = extractPlainText(doc);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          void doAutosave(doc, plain);
        }
      },
      []
    );

    // Sync hidden inputs on mount (pre-existing rich content) AND in the capture
    // phase of every form submit so paste/typed content is always in FormData,
    // regardless of React's batching timing.
    useEffect(() => {
      if (!editor) return;

      if (answerTextInputRef.current) answerTextInputRef.current.value = initialPlainResolved;
      if (answerRichJsonInputRef.current) answerRichJsonInputRef.current.value = JSON.stringify(initialDoc);

      const form = answerTextInputRef.current?.form ?? null;
      if (!form) return;

      const ed = editor;
      function syncBeforeSubmit() {
        const doc = ed.getJSON() as TiptapDoc;
        const plain = extractPlainText(doc);
        if (answerTextInputRef.current) answerTextInputRef.current.value = plain;
        if (answerRichJsonInputRef.current) answerRichJsonInputRef.current.value = JSON.stringify(doc);
      }

      form.addEventListener("submit", syncBeforeSubmit, true); // capture fires before React's handler
      return () => form.removeEventListener("submit", syncBeforeSubmit, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor]);

    useImperativeHandle(ref, () => ({
      replaceWithPlainText(text: string) {
        if (!editor) return;
        const doc = plainTextToTiptapDoc(text);
        editor.commands.setContent(doc);
        const plain = extractPlainText(doc);
        syncHiddenInputs(doc, plain);
        onPlainTextChange?.(plain);
        scheduleAutosave(doc, plain);
      },
      appendPlainText(text: string) {
        if (!editor || !text.trim()) return;
        editor.commands.focus("end");
        editor.commands.insertContent(
          text
            .split("\n")
            .map((line) => ({ type: "paragraph", content: line ? [{ type: "text", text: line }] : [] }))
        );
      },
      getPlainText() {
        if (!editor) return "";
        return extractPlainText(editor.getJSON() as TiptapDoc);
      }
    }));

    function syncHiddenInputs(doc: TiptapDoc, plain: string) {
      if (answerTextInputRef.current) answerTextInputRef.current.value = plain;
      if (answerRichJsonInputRef.current) answerRichJsonInputRef.current.value = JSON.stringify(doc);
    }

    function scheduleAutosave(doc: TiptapDoc, plain: string) {
      if (disableAutosave) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void doAutosave(doc, plain);
      }, 700);
    }

    async function doAutosave(doc: TiptapDoc, plain: string) {
      setSaveStatus("saving");
      try {
        const response = await fetch("/api/answers/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storybookId,
            chapterInstanceId,
            questionId,
            answerRich: doc,
            answerPlain: plain,
            answerText: plain
          })
        });
        const data = (await response.json()) as { ok: boolean };
        setSaveStatus(data.ok ? "saved" : "error");
        if (data.ok) {
          setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
        }
      } catch {
        setSaveStatus("error");
      }
    }

    return (
      <div className="space-y-1">
        <AnswerToolbar editor={editor} />
        <div className="relative rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3 focus-within:border-gold/45 transition-colors">
          <EditorContent
            editor={editor}
            className={[
              "min-h-[11rem] text-base leading-7 text-white",
              "[&_.ProseMirror]:outline-none",
              // Placeholder via CSS attr
              "[&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none",
              "[&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left",
              "[&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0",
              "[&_.ProseMirror_p.is-editor-empty:first-child]:before:text-white/35",
              "[&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
              // Lists
              "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5",
              "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5",
              "[&_.ProseMirror_li]:my-0.5",
              // Headings
              "[&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-bold",
              "[&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-bold",
              // Links
              "[&_.ProseMirror_a]:text-gold [&_.ProseMirror_a]:underline"
            ].join(" ")}
          />
        </div>

        {/* Hidden inputs consumed by the server form action */}
        <input
          ref={answerTextInputRef}
          type="hidden"
          name={answerTextInputName}
          defaultValue={initialPlainResolved}
        />
        <input
          ref={answerRichJsonInputRef}
          type="hidden"
          name={answerRichJsonInputName}
          defaultValue={initialContent ? JSON.stringify(initialContent) : ""}
        />

        {!disableAutosave && saveStatus === "saving" && (
          <p className="text-xs text-white/40">Saving…</p>
        )}
        {!disableAutosave && saveStatus === "saved" && (
          <p className="text-xs text-emerald-400/70">Saved</p>
        )}
        {!disableAutosave && saveStatus === "error" && (
          <p className="text-xs text-rose-400/70">Save failed — will retry on next change</p>
        )}
      </div>
    );
  }
);
