"use client";

import type { CSSProperties } from "react";
import { useRef, useState, useEffect } from "react";
import { cn } from "../../ui/cn";
import type { TextToolbarStyleState } from "./TextToolbarControls";
import { TextToolbarControls } from "./TextToolbarControls";
import { ImprovePreviewModal } from "./ImprovePreviewModal";

// ─── Improve action types ───────────────────────────────────────────────────

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

function actionLabel(action: ImproveAction): string {
  if (action.type === "tone") return `${action.tone} tone`;
  const labels: Record<string, string> = {
    fix_grammar: "Fix spelling & grammar",
    extend: "Extend text",
    reduce: "Reduce text",
    simplify: "Simplify text",
    emojify: "Emojify",
    ask_ai: "Ask AI",
    complete: "Complete sentence",
    summarize: "Summarize"
  };
  return labels[action.type] ?? action.type;
}

const ITEM =
  "w-full cursor-pointer px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-between gap-2";

// ─── FrameImproveButton ─────────────────────────────────────────────────────

function FrameImproveButton({
  frameText,
  onApplyImprovedText
}: {
  frameText: string;
  onApplyImprovedText: (text: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toneOpen, setToneOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [askPrompt, setAskPrompt] = useState("");

  const [improving, setImproving] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    label: string;
    result: string | null;
  }>({ open: false, label: "", result: null });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) { setToneOpen(false); setAskOpen(false); return; }
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  async function run(action: ImproveAction) {
    const text = frameText.trim();
    if (!text) return;
    setMenuOpen(false);
    setImproving(true);
    setModal({ open: true, label: actionLabel(action), result: null });
    try {
      const res = await fetch("/api/editor/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, action })
      });
      const data = await res.json() as { ok: boolean; result?: string };
      setModal((m) => ({ ...m, result: data.ok && data.result ? data.result : null }));
    } finally {
      setImproving(false);
    }
  }

  function handleAccept() {
    if (modal.result) onApplyImprovedText(modal.result);
    setModal({ open: false, label: "", result: null });
  }

  function handleCancel() {
    setModal({ open: false, label: "", result: null });
    setImproving(false);
  }

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setMenuOpen((s) => !s); }}
          disabled={improving || !frameText.trim()}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {improving
            ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            : <span aria-hidden="true">✦</span>}
          Improve
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current opacity-50" aria-hidden="true">
            <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">

            {/* Tone submenu */}
            <button type="button" className={ITEM}
              onMouseDown={(e) => { e.preventDefault(); setToneOpen((s) => !s); setAskOpen(false); }}>
              <span className="flex items-center gap-2"><span>🎨</span> Adjust tone</span>
              <svg viewBox="0 0 16 16" className={`h-3 w-3 shrink-0 fill-current opacity-40 transition-transform ${toneOpen ? "rotate-90" : ""}`} aria-hidden="true">
                <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
            {toneOpen && (
              <div className="max-h-48 overflow-y-auto border-y border-gray-100 bg-gray-50 py-1">
                {TONES.map((tone) => (
                  <button key={tone} type="button"
                    onMouseDown={(e) => { e.preventDefault(); void run({ type: "tone", tone }); }}
                    className="w-full cursor-pointer px-5 py-1.5 text-left text-xs text-gray-600 hover:bg-gray-100">
                    {tone}
                  </button>
                ))}
              </div>
            )}

            <button type="button" className={ITEM}
              onMouseDown={(e) => { e.preventDefault(); void run({ type: "fix_grammar" }); }}>
              <span className="flex items-center gap-2"><span>✓</span> Fix spelling &amp; grammar</span>
            </button>
            <button type="button" className={ITEM}
              onMouseDown={(e) => { e.preventDefault(); void run({ type: "extend" }); }}>
              <span className="flex items-center gap-2"><span>↕</span> Extend text</span>
            </button>
            <button type="button" className={ITEM}
              onMouseDown={(e) => { e.preventDefault(); void run({ type: "reduce" }); }}>
              <span className="flex items-center gap-2"><span>↑</span> Reduce text</span>
            </button>
            <button type="button" className={ITEM}
              onMouseDown={(e) => { e.preventDefault(); void run({ type: "simplify" }); }}>
              <span className="flex items-center gap-2"><span>◈</span> Simplify text</span>
            </button>
            <button type="button" className={ITEM}
              onMouseDown={(e) => { e.preventDefault(); void run({ type: "emojify" }); }}>
              <span className="flex items-center gap-2"><span>😊</span> Emojify</span>
            </button>

            <div className="my-1 border-t border-gray-100" />

            {/* Ask AI */}
            <button type="button" className={ITEM}
              onMouseDown={(e) => { e.preventDefault(); setAskOpen((s) => !s); setToneOpen(false); }}>
              <span className="flex items-center gap-2"><span>✨</span> Ask AI</span>
            </button>
            {askOpen && (
              <div className="border-t border-gray-100 px-3 py-2">
                <input
                  type="text"
                  value={askPrompt}
                  onChange={(e) => setAskPrompt(e.target.value)}
                  placeholder="e.g. Make it more formal…"
                  className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
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
                  className="mt-1.5 w-full cursor-pointer rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-700">
                  Apply
                </button>
              </div>
            )}

            <button type="button" className={ITEM}
              onMouseDown={(e) => { e.preventDefault(); void run({ type: "complete" }); }}>
              <span className="flex items-center gap-2"><span>→</span> Complete sentence</span>
            </button>
            <button type="button" className={ITEM}
              onMouseDown={(e) => { e.preventDefault(); void run({ type: "summarize" }); }}>
              <span className="flex items-center gap-2"><span>≡</span> Summarize</span>
            </button>
          </div>
        )}
      </div>

      {modal.open && (
        <ImprovePreviewModal
          actionLabel={modal.label}
          original={frameText}
          improved={modal.result}
          loading={improving}
          onAccept={handleAccept}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

// ─── MiniActionIcon ──────────────────────────────────────────────────────────

function MiniActionIcon({ kind }: { kind: "copy" | "lock" | "unlock" | "delete" }) {
  const common = {
    className: "h-4 w-4",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  if (kind === "copy") {
    return (
      <svg {...common}>
        <rect x="9" y="9" width="10" height="10" rx="2" />
        <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
      </svg>
    );
  }
  if (kind === "delete") {
    return (
      <svg {...common}>
        <path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M8 7l1 12h6l1-12" />
      </svg>
    );
  }
  if (kind === "lock") {
    return (
      <svg {...common}>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 7 2" />
    </svg>
  );
}

// ─── FloatingTextToolbar ─────────────────────────────────────────────────────

export function FloatingTextToolbar({
  open,
  position,
  selectionPosition,
  maxWidthPx,
  style,
  onPatchStyle,
  onOpenFontPanel,
  onOpenColorPanel,
  onDuplicate,
  onDelete,
  onToggleLock,
  locked,
  frameText = "",
  onApplyImprovedText
}: {
  open: boolean;
  position: { left: number; top: number; visible: boolean };
  selectionPosition?: { left: number; top: number; visible: boolean };
  maxWidthPx?: number;
  style: TextToolbarStyleState;
  onPatchStyle: (patch: Record<string, unknown>) => void;
  onOpenFontPanel?: () => void;
  onOpenColorPanel?: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  locked: boolean;
  frameText?: string;
  onApplyImprovedText?: (text: string) => void;
}) {
  const inlineStyle: CSSProperties = {
    left: position.left,
    top: position.top,
    maxWidth: maxWidthPx ? `${Math.max(280, Math.min(maxWidthPx, 980))}px` : undefined
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-30 -translate-x-1/2 transition",
        open && position.visible ? "opacity-100" : "opacity-0"
      )}
      style={inlineStyle}
      aria-hidden={!open}
    >
      <div className="pointer-events-auto">
        <div className="flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-1.5 py-1 shadow-md">

          {/* Improve button (only when handler provided) */}
          {onApplyImprovedText && (
            <>
              <FrameImproveButton
                frameText={frameText}
                onApplyImprovedText={onApplyImprovedText}
              />
              <div className="h-5 w-px shrink-0 bg-gray-200 mx-0.5" />
            </>
          )}

          <TextToolbarControls
            style={style}
            onPatchStyle={onPatchStyle}
            onOpenFontPanel={onOpenFontPanel}
          />
        </div>

        {selectionPosition?.visible ? (
          <div
            className="pointer-events-auto absolute z-10 -translate-x-1/2"
            style={{ left: selectionPosition.left - position.left, top: selectionPosition.top - position.top }}
          >
            <div className="mt-2 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-md">
              <button type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                onClick={onDuplicate} aria-label="Duplicate text box" title="Duplicate">
                <MiniActionIcon kind="copy" />
              </button>
              <button type="button"
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded border shadow-sm ${
                  locked ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={onToggleLock} aria-label={locked ? "Unlock text box" : "Lock text box"} title={locked ? "Unlock" : "Lock"}>
                <MiniActionIcon kind={locked ? "unlock" : "lock"} />
              </button>
              <button type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-rose-200 bg-white text-rose-700 shadow-sm hover:bg-rose-50"
                onClick={onDelete} aria-label="Delete text box" title="Delete">
                <MiniActionIcon kind="delete" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
