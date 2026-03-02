"use client";

import { useRef, useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { ImproveMenu } from "../../../../packages/editor/ui/ImproveMenu";

const BTN =
  "inline-flex items-center justify-center w-8 h-8 cursor-pointer rounded text-sm font-medium text-white/60 " +
  "hover:bg-white/10 hover:text-white transition-colors " +
  "data-[active]:bg-white/15 data-[active]:text-white disabled:opacity-40 disabled:cursor-not-allowed";

const SEP = "h-5 w-px bg-white/15 mx-0.5 shrink-0";

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
        className="flex h-8 cursor-pointer items-center gap-1 rounded px-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white"
      >
        {label}
        <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current opacity-50" aria-hidden="true">
          <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[9.5rem] overflow-hidden rounded-lg border border-white/10 bg-[#1a1b2e] py-1 shadow-xl">
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
                "w-full cursor-pointer px-3 py-1.5 text-left text-xs hover:bg-white/10",
                current === opt.value ? "font-semibold text-white" : "text-white/65"
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

type ToolbarProps = {
  editor: Editor | null;
};

export function AnswerToolbar({ editor }: ToolbarProps) {
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  if (!editor) return null;
  const ed = editor;

  function handleColorClick(e: React.MouseEvent) {
    e.preventDefault();
    colorInputRef.current?.click();
  }

  function handleLink() {
    const prev = ed.getAttributes("link").href as string | undefined;
    const url = globalThis.prompt("Enter URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") { ed.chain().focus().unsetLink().run(); return; }
    ed.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.06] px-1.5 py-1">
      <ImproveMenu editor={ed} dark />

      <div className={SEP} />

      <BlockTypeSelector editor={ed} />

      <div className={SEP} />

      {/* Inline marks */}
      <button type="button" title="Bold" data-active={ed.isActive("bold") || undefined}
        onMouseDown={cmd(() => ed.chain().focus().toggleBold().run())} className={BTN}>
        <strong>B</strong>
      </button>
      <button type="button" title="Italic" data-active={ed.isActive("italic") || undefined}
        onMouseDown={cmd(() => ed.chain().focus().toggleItalic().run())} className={BTN}>
        <em>I</em>
      </button>
      <button type="button" title="Underline" data-active={ed.isActive("underline") || undefined}
        onMouseDown={cmd(() => ed.chain().focus().toggleUnderline().run())} className={BTN}>
        <span className="underline">U</span>
      </button>
      <button type="button" title="Strikethrough" data-active={ed.isActive("strike") || undefined}
        onMouseDown={cmd(() => ed.chain().focus().toggleStrike().run())} className={BTN}>
        <span className="line-through">S</span>
      </button>
      <button type="button" title="Inline code" data-active={ed.isActive("code") || undefined}
        onMouseDown={cmd(() => ed.chain().focus().toggleCode().run())} className={BTN}>
        <CodeIcon />
      </button>

      {/* Link */}
      <button type="button" title="Link" data-active={ed.isActive("link") || undefined}
        onClick={handleLink} className={BTN}>
        <LinkIcon />
      </button>

      {/* Text color */}
      <div className="relative">
        <button type="button" title="Text color"
          onMouseDown={handleColorClick}
          className={BTN} style={{ flexDirection: "column", gap: 1 }}>
          <span className="text-sm font-bold leading-none">A</span>
          <span className="h-0.5 w-4 rounded-full"
            style={{ backgroundColor: (ed.getAttributes("textStyle").color as string | undefined) ?? "#ffffff" }} />
        </button>
        <input ref={colorInputRef} type="color" className="sr-only" defaultValue="#ffffff"
          onChange={(e) => ed.chain().focus().setColor(e.target.value).run()} />
      </div>

      <div className={SEP} />

      {/* Alignment */}
      <button type="button" title="Align left" data-active={ed.isActive({ textAlign: "left" }) || undefined}
        onMouseDown={cmd(() => ed.chain().focus().setTextAlign("left").run())} className={BTN}>
        <AlignLeftIcon />
      </button>
      <button type="button" title="Align center" data-active={ed.isActive({ textAlign: "center" }) || undefined}
        onMouseDown={cmd(() => ed.chain().focus().setTextAlign("center").run())} className={BTN}>
        <AlignCenterIcon />
      </button>
      <button type="button" title="Align right" data-active={ed.isActive({ textAlign: "right" }) || undefined}
        onMouseDown={cmd(() => ed.chain().focus().setTextAlign("right").run())} className={BTN}>
        <AlignRightIcon />
      </button>
      <button type="button" title="Justify" data-active={ed.isActive({ textAlign: "justify" }) || undefined}
        onMouseDown={cmd(() => ed.chain().focus().setTextAlign("justify").run())} className={BTN}>
        <AlignJustifyIcon />
      </button>

      <div className={SEP} />

      {/* Superscript / subscript */}
      <button type="button" title="Superscript" data-active={ed.isActive("superscript") || undefined}
        onMouseDown={cmd(() => ed.chain().focus().toggleSuperscript().run())} className={BTN}>
        <span className="text-xs leading-none">x<sup className="text-[9px]">2</sup></span>
      </button>
      <button type="button" title="Subscript" data-active={ed.isActive("subscript") || undefined}
        onMouseDown={cmd(() => ed.chain().focus().toggleSubscript().run())} className={BTN}>
        <span className="text-xs leading-none">x<sub className="text-[9px]">2</sub></span>
      </button>
    </div>
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
