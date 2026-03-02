"use client";

import { useRef, useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";

type ImproveAction =
  | { type: "tone"; tone: string }
  | { type: "fix_grammar" }
  | { type: "extend" }
  | { type: "reduce" }
  | { type: "simplify" }
  | { type: "emojify" }
  | { type: "ask_ai"; prompt: string }
  | { type: "complete" }
  | { type: "summarize" };

const TONES = [
  "Academic", "Business", "Casual", "Childfriendly", "Confident",
  "Conversational", "Creative", "Emotional", "Excited", "Formal",
  "Friendly", "Funny", "Informative", "Inspirational", "Narrative",
  "Objective", "Persuasive", "Poetic"
];

type Props = {
  editor: Editor | null;
  /** Defaults to /api/editor/improve */
  apiUrl?: string;
  /** Use dark-on-dark styling for dark backgrounds (e.g. wizard page) */
  dark?: boolean;
};

export function ImproveMenu({ editor, apiUrl = "/api/editor/improve", dark = false }: Props) {
  const [open, setOpen] = useState(false);
  const [toneOpen, setToneOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [askPrompt, setAskPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setToneOpen(false); setAskOpen(false); return; }
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!editor) return null;
  const ed = editor;

  function getContext(): { text: string; isSelection: boolean; from: number; to: number } {
    const { from, to } = ed.state.selection;
    const isSelection = from !== to;
    const text = isSelection
      ? ed.state.doc.textBetween(from, to, "\n")
      : ed.getText({ blockSeparator: "\n" });
    return { text, isSelection, from, to };
  }

  async function run(action: ImproveAction) {
    const { text, isSelection, from, to } = getContext();
    if (!text.trim()) return;
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, action })
      });
      const data = await res.json() as { ok: boolean; result?: string };
      if (!data.ok || !data.result) return;
      if (isSelection) {
        ed.chain().focus().deleteRange({ from, to }).insertContent(data.result).run();
      } else {
        ed.commands.setContent({
          type: "doc",
          content: data.result.split("\n").filter(Boolean).map((line) => ({
            type: "paragraph",
            content: [{ type: "text", text: line }]
          }))
        });
      }
    } finally {
      setLoading(false);
    }
  }

  // Style tokens
  const triggerCls = dark
    ? "flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs font-medium text-white/85 hover:bg-white/15 disabled:opacity-50"
    : "flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50";

  const panelCls = dark
    ? "absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-white/10 bg-[#1a1b2e] py-1 shadow-xl"
    : "absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg";

  const itemCls = dark
    ? "w-full cursor-pointer px-3 py-1.5 text-left text-xs text-white/70 hover:bg-white/10 flex items-center justify-between gap-2"
    : "w-full cursor-pointer px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-between gap-2";

  const toneSubCls = dark
    ? "max-h-48 overflow-y-auto border-y border-white/10 bg-[#14152a] py-1"
    : "max-h-48 overflow-y-auto border-y border-gray-100 bg-gray-50 py-1";

  const toneBtnCls = dark
    ? "w-full cursor-pointer px-5 py-1.5 text-left text-xs text-white/60 hover:bg-white/10"
    : "w-full cursor-pointer px-5 py-1.5 text-left text-xs text-gray-600 hover:bg-gray-100";

  const dividerCls = dark ? "my-1 border-t border-white/10" : "my-1 border-t border-gray-100";

  const askPanelCls = dark ? "border-t border-white/10 bg-[#1a1b2e] px-3 py-2" : "border-t border-gray-100 px-3 py-2";

  const askInputCls = dark
    ? "w-full rounded border border-white/15 bg-white/10 px-2 py-1 text-xs text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-white/25"
    : "w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300";

  const spinnerCls = dark
    ? "inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white/80"
    : "inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((s) => !s); }}
        disabled={loading}
        className={triggerCls}
      >
        {loading ? <span className={spinnerCls} /> : <span aria-hidden="true">✦</span>}
        Improve
        <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current opacity-50" aria-hidden="true">
          <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>

      {open && (
        <div className={panelCls}>

          {/* Adjust tone */}
          <button type="button" className={itemCls}
            onMouseDown={(e) => { e.preventDefault(); setToneOpen((s) => !s); setAskOpen(false); }}>
            <span className="flex items-center gap-2"><span>🎨</span> Adjust tone</span>
            <svg viewBox="0 0 16 16" className={`h-3 w-3 shrink-0 fill-current opacity-40 transition-transform ${toneOpen ? "rotate-90" : ""}`} aria-hidden="true">
              <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
          {toneOpen && (
            <div className={toneSubCls}>
              {TONES.map((tone) => (
                <button key={tone} type="button"
                  onMouseDown={(e) => { e.preventDefault(); void run({ type: "tone", tone }); }}
                  className={toneBtnCls}>
                  {tone}
                </button>
              ))}
            </div>
          )}

          <button type="button" className={itemCls}
            onMouseDown={(e) => { e.preventDefault(); void run({ type: "fix_grammar" }); }}>
            <span className="flex items-center gap-2"><span>✓</span> Fix spelling &amp; grammar</span>
          </button>
          <button type="button" className={itemCls}
            onMouseDown={(e) => { e.preventDefault(); void run({ type: "extend" }); }}>
            <span className="flex items-center gap-2"><span>↕</span> Extend text</span>
          </button>
          <button type="button" className={itemCls}
            onMouseDown={(e) => { e.preventDefault(); void run({ type: "reduce" }); }}>
            <span className="flex items-center gap-2"><span>↑</span> Reduce text</span>
          </button>
          <button type="button" className={itemCls}
            onMouseDown={(e) => { e.preventDefault(); void run({ type: "simplify" }); }}>
            <span className="flex items-center gap-2"><span>◈</span> Simplify text</span>
          </button>
          <button type="button" className={itemCls}
            onMouseDown={(e) => { e.preventDefault(); void run({ type: "emojify" }); }}>
            <span className="flex items-center gap-2"><span>😊</span> Emojify</span>
          </button>

          <div className={dividerCls} />

          {/* Ask AI */}
          <button type="button" className={itemCls}
            onMouseDown={(e) => { e.preventDefault(); setAskOpen((s) => !s); setToneOpen(false); }}>
            <span className="flex items-center gap-2"><span>✨</span> Ask AI</span>
          </button>
          {askOpen && (
            <div className={askPanelCls}>
              <input
                type="text"
                value={askPrompt}
                onChange={(e) => setAskPrompt(e.target.value)}
                placeholder="e.g. Make it more formal…"
                className={askInputCls}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && askPrompt.trim()) {
                    void run({ type: "ask_ai", prompt: askPrompt });
                    setAskPrompt("");
                  }
                }}
              />
              <button type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!askPrompt.trim()) return;
                  void run({ type: "ask_ai", prompt: askPrompt });
                  setAskPrompt("");
                }}
                className="mt-1.5 w-full cursor-pointer rounded bg-white/15 px-2 py-1 text-xs font-medium text-white hover:bg-white/25">
                Apply
              </button>
            </div>
          )}

          <button type="button" className={itemCls}
            onMouseDown={(e) => { e.preventDefault(); void run({ type: "complete" }); }}>
            <span className="flex items-center gap-2"><span>→</span> Complete sentence</span>
          </button>
          <button type="button" className={itemCls}
            onMouseDown={(e) => { e.preventDefault(); void run({ type: "summarize" }); }}>
            <span className="flex items-center gap-2"><span>≡</span> Summarize</span>
          </button>
        </div>
      )}
    </div>
  );
}
