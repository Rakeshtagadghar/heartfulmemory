"use client";

import { FloatingMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";

type Props = {
  editor: Editor | null;
};

const BTN =
  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/55 " +
  "hover:bg-white/[0.08] hover:text-white/85 transition";

/**
 * RichTextFloatingMenu
 *
 * Appears on an empty line to offer quick formatting shortcuts.
 * Does not interfere with the navbar.
 */
export function RichTextFloatingMenu({ editor }: Props) {
  if (!editor) return null;

  return (
    <FloatingMenu
      editor={editor}
      options={{ placement: "left" }}
      className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-[#1a1a2e]/90 px-1 py-0.5 shadow-lg backdrop-blur-sm"
    >
      <button
        type="button"
        title="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={BTN}
      >
        • List
      </button>
      <button
        type="button"
        title="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={BTN}
      >
        1. List
      </button>
      <button
        type="button"
        title="Heading"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={BTN}
      >
        H2
      </button>
    </FloatingMenu>
  );
}
