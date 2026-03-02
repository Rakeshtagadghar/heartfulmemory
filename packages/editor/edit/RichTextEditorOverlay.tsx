"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import type { TiptapDoc } from "../../shared/richtext/tiptapTypes";
import { extractPlainText } from "../../shared/richtext/extractPlainText";
import { migrateTextNodeContent } from "../migrations/textToTiptap";
import { RichTextBubbleMenu } from "../ui/RichTextBubbleMenu";

type Props = {
  /** The current text node content (may be legacy or already rich). */
  nodeContent: Record<string, unknown> | null;
  /** Called when the editor loses focus with the updated doc + plain text. */
  onCommit: (doc: TiptapDoc, plainText: string) => void;
  /** Called when Escape is pressed (discard). */
  onDiscard?: () => void;
  placeholder?: string;
  className?: string;
};

/**
 * RichTextEditorOverlay
 *
 * Mounts a live Tiptap editor on top of a Studio text node.
 * Double-click a text frame to enter edit mode → this component mounts.
 * On blur or Escape → commit or discard.
 *
 * Performance note: Only ONE instance should be mounted at a time.
 */
export function RichTextEditorOverlay({
  nodeContent,
  onCommit,
  onDiscard,
  placeholder = "Type here…",
  className
}: Props) {
  const committedRef = useRef(false);
  const initialDoc = migrateTextNodeContent(nodeContent);

  const editor = useEditor(
    {
      immediatelyRender: false,
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
      onBlur({ editor: ed }) {
        // Defer one frame so BubbleMenu button clicks can call editor.chain().focus()
        // before we decide to commit, avoiding a premature commit on formatting clicks.
        globalThis.requestAnimationFrame(() => {
          if (ed.isFocused || committedRef.current) return;
          committedRef.current = true;
          const doc = ed.getJSON() as TiptapDoc;
          onCommit(doc, extractPlainText(doc));
        });
      }
    },
    []
  );

  // Auto-focus on mount and handle Escape
  useEffect(() => {
    editor?.commands.focus("end");

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        committedRef.current = true; // Prevent blur from committing
        onDiscard?.();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, onDiscard]);

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <RichTextBubbleMenu editor={editor} />
      <EditorContent
        editor={editor}
        style={{ width: "100%", height: "100%", outline: "none" }}
        className={[
          "[&_.ProseMirror]:outline-none [&_.ProseMirror]:h-full [&_.ProseMirror]:w-full",
          "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-4",
          "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-4",
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0",
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:text-current/40",
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]"
        ].join(" ")}
      />
    </div>
  );
}
