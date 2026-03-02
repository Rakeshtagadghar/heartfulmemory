"use client";

import { useRef, useState, useEffect } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { ImproveMenu } from "./ImproveMenu";

type Props = {
  editor: Editor | null;
};

const BTN =
  "inline-flex items-center justify-center w-8 h-8 cursor-pointer rounded text-sm font-medium text-gray-600 " +
  "hover:bg-gray-100 hover:text-gray-900 transition-colors " +
  "data-[active]:bg-gray-100 data-[active]:text-gray-900";

const SEP = "h-5 w-px bg-gray-200 mx-0.5 shrink-0";

/** Prevents editor blur so the exact text selection is preserved when a toolbar button is clicked. */
function cmd(fn: () => void) {
  return (e: React.MouseEvent) => { e.preventDefault(); fn(); };
}

const BLOCK_OPTIONS = [
  { value: "Text", label: "Text" },
  { value: "H1", label: "Heading 1" },
  { value: "H2", label: "Heading 2" },
  { value: "H3", label: "Heading 3" },
  { value: "Bullet", label: "Bulleted list" },
  { value: "Numbered", label: "Numbered list" },
  { value: "Quote", label: "Blockquote" },
  { value: "Code", label: "Code block" },
];

function getBlockType(editor: Editor): string {
  if (editor.isActive("heading", { level: 1 })) return "H1";
  if (editor.isActive("heading", { level: 2 })) return "H2";
  if (editor.isActive("heading", { level: 3 })) return "H3";
  if (editor.isActive("bulletList")) return "Bullet";
  if (editor.isActive("orderedList")) return "Numbered";
  if (editor.isActive("blockquote")) return "Quote";
  if (editor.isActive("codeBlock")) return "Code";
  return "Text";
}

function BlockTypeSelector({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = getBlockType(editor);
  const label = BLOCK_OPTIONS.find((o) => o.value === current)?.label ?? current;

  useEffect(() => {
    if (!open) return;
    function handleDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [open]);

  function applyBlockType(value: string) {
    const chain = editor.chain().focus();
    if (value === "Text") chain.setParagraph().run();
    else if (value === "H1") chain.toggleHeading({ level: 1 }).run();
    else if (value === "H2") chain.toggleHeading({ level: 2 }).run();
    else if (value === "H3") chain.toggleHeading({ level: 3 }).run();
    else if (value === "Bullet") chain.toggleBulletList().run();
    else if (value === "Numbered") chain.toggleOrderedList().run();
    else if (value === "Quote") chain.toggleBlockquote().run();
    else if (value === "Code") chain.toggleCodeBlock().run();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((s) => !s); }}
        className="flex h-8 cursor-pointer items-center gap-1 rounded px-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
      >
        {label}
        <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current opacity-50" aria-hidden="true">
          <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[9.5rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {BLOCK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applyBlockType(opt.value);
                setOpen(false);
              }}
              className={[
                "w-full cursor-pointer px-3 py-1.5 text-left text-xs hover:bg-gray-50",
                current === opt.value ? "font-semibold text-gray-900" : "text-gray-700"
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RichTextBubbleMenu({ editor }: Props) {
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor?.isActive("bold") ?? false,
      isItalic: ctx.editor?.isActive("italic") ?? false,
      isUnderline: ctx.editor?.isActive("underline") ?? false,
      isStrike: ctx.editor?.isActive("strike") ?? false,
      isCode: ctx.editor?.isActive("code") ?? false,
      isLink: ctx.editor?.isActive("link") ?? false,
      isSuperscript: ctx.editor?.isActive("superscript") ?? false,
      isSubscript: ctx.editor?.isActive("subscript") ?? false,
      isAlignLeft: ctx.editor?.isActive({ textAlign: "left" }) ?? false,
      isAlignCenter: ctx.editor?.isActive({ textAlign: "center" }) ?? false,
      isAlignRight: ctx.editor?.isActive({ textAlign: "right" }) ?? false,
      isAlignJustify: ctx.editor?.isActive({ textAlign: "justify" }) ?? false,
      textColor: (ctx.editor?.getAttributes("textStyle").color as string | undefined) ?? "#000000"
    })
  });

  if (!editor) return null;
  const ed = editor;

  function handleLink() {
    const prev = ed.getAttributes("link").href as string | undefined;
    const url = globalThis.prompt("Enter URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") { ed.chain().focus().unsetLink().run(); return; }
    ed.chain().focus().setLink({ href: url }).run();
  }

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top" }}
      className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1.5 py-1 shadow-md"
    >
      <ImproveMenu editor={editor} />

      <div className={SEP} />

      <BlockTypeSelector editor={editor} />

      <div className={SEP} />

      {/* Inline marks */}
      <button type="button" title="Bold" data-active={editorState?.isBold || undefined}
        onMouseDown={cmd(() => editor.chain().focus().toggleBold().run())} className={BTN}>
        <strong>B</strong>
      </button>
      <button type="button" title="Italic" data-active={editorState?.isItalic || undefined}
        onMouseDown={cmd(() => editor.chain().focus().toggleItalic().run())} className={BTN}>
        <em>I</em>
      </button>
      <button type="button" title="Underline" data-active={editorState?.isUnderline || undefined}
        onMouseDown={cmd(() => editor.chain().focus().toggleUnderline().run())} className={BTN}>
        <span className="underline">U</span>
      </button>
      <button type="button" title="Strikethrough" data-active={editorState?.isStrike || undefined}
        onMouseDown={cmd(() => editor.chain().focus().toggleStrike().run())} className={BTN}>
        <span className="line-through">S</span>
      </button>
      <button type="button" title="Inline code" data-active={editorState?.isCode || undefined}
        onMouseDown={cmd(() => editor.chain().focus().toggleCode().run())} className={BTN}>
        <CodeIcon />
      </button>

      {/* Link */}
      <button type="button" title="Link" data-active={editorState?.isLink || undefined}
        onClick={handleLink} className={BTN}>
        <LinkIcon />
      </button>

      {/* Text color */}
      <div className="relative">
        <button type="button" title="Text color"
          onMouseDown={cmd(() => colorInputRef.current?.click())}
          className={BTN} style={{ flexDirection: "column", gap: 1 }}>
          <span className="text-sm font-bold leading-none">A</span>
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: editorState?.textColor ?? "#000" }} />
        </button>
        <input ref={colorInputRef} type="color" className="sr-only" defaultValue="#000000"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
      </div>

      <div className={SEP} />

      {/* Alignment */}
      <button type="button" title="Align left" data-active={editorState?.isAlignLeft || undefined}
        onMouseDown={cmd(() => editor.chain().focus().setTextAlign("left").run())} className={BTN}>
        <AlignLeftIcon />
      </button>
      <button type="button" title="Align center" data-active={editorState?.isAlignCenter || undefined}
        onMouseDown={cmd(() => editor.chain().focus().setTextAlign("center").run())} className={BTN}>
        <AlignCenterIcon />
      </button>
      <button type="button" title="Align right" data-active={editorState?.isAlignRight || undefined}
        onMouseDown={cmd(() => editor.chain().focus().setTextAlign("right").run())} className={BTN}>
        <AlignRightIcon />
      </button>
      <button type="button" title="Justify" data-active={editorState?.isAlignJustify || undefined}
        onMouseDown={cmd(() => editor.chain().focus().setTextAlign("justify").run())} className={BTN}>
        <AlignJustifyIcon />
      </button>

      <div className={SEP} />

      {/* Superscript / subscript */}
      <button type="button" title="Superscript" data-active={editorState?.isSuperscript || undefined}
        onMouseDown={cmd(() => editor.chain().focus().toggleSuperscript().run())} className={BTN}>
        <span className="text-xs leading-none">x<sup className="text-[9px]">2</sup></span>
      </button>
      <button type="button" title="Subscript" data-active={editorState?.isSubscript || undefined}
        onMouseDown={cmd(() => editor.chain().focus().toggleSubscript().run())} className={BTN}>
        <span className="text-xs leading-none">x<sub className="text-[9px]">2</sub></span>
      </button>
    </BubbleMenu>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
      <path d="M5.854 4.146a.5.5 0 0 1 0 .708L3.707 7l2.147 2.146a.5.5 0 0 1-.708.708l-2.5-2.5a.5.5 0 0 1 0-.708l2.5-2.5a.5.5 0 0 1 .708 0Zm4.292 0a.5.5 0 0 1 .708 0l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5a.5.5 0 0 1-.708-.708L12.293 7 10.146 4.854a.5.5 0 0 1 0-.708Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
      <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 9.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1Z"/>
      <path d="M9 5.5a3 3 0 0 0-2.83 4h.002c.086 0 .17-.01.25-.031A2 2 0 0 1 9 8.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9Z"/>
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
      <rect x="1" y="3" width="14" height="1.5" rx="0.5" /><rect x="1" y="6.5" width="9" height="1.5" rx="0.5" />
      <rect x="1" y="10" width="14" height="1.5" rx="0.5" /><rect x="1" y="13.5" width="9" height="1.5" rx="0.5" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
      <rect x="1" y="3" width="14" height="1.5" rx="0.5" /><rect x="3.5" y="6.5" width="9" height="1.5" rx="0.5" />
      <rect x="1" y="10" width="14" height="1.5" rx="0.5" /><rect x="3.5" y="13.5" width="9" height="1.5" rx="0.5" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
      <rect x="1" y="3" width="14" height="1.5" rx="0.5" /><rect x="6" y="6.5" width="9" height="1.5" rx="0.5" />
      <rect x="1" y="10" width="14" height="1.5" rx="0.5" /><rect x="6" y="13.5" width="9" height="1.5" rx="0.5" />
    </svg>
  );
}

function AlignJustifyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
      <rect x="1" y="3" width="14" height="1.5" rx="0.5" /><rect x="1" y="6.5" width="14" height="1.5" rx="0.5" />
      <rect x="1" y="10" width="14" height="1.5" rx="0.5" /><rect x="1" y="13.5" width="14" height="1.5" rx="0.5" />
    </svg>
  );
}
