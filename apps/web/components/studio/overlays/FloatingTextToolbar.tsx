"use client";

import type { CSSProperties } from "react";
import { cn } from "../../ui/cn";
import type { TextToolbarStyleState } from "./TextToolbarControls";
import { TextToolbarControls } from "./TextToolbarControls";

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
        <path d="M4 7h16" />
        <path d="M9 7V5h6v2" />
        <path d="M8 7l1 12h6l1-12" />
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
  locked
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
        <div className="max-w-full rounded-2xl border border-slate-300/80 bg-white/98 p-1 text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.16)] backdrop-blur">
          <div className="flex items-center gap-1.5">
            <TextToolbarControls
              style={style}
              onPatchStyle={onPatchStyle}
              onOpenFontPanel={onOpenFontPanel}
              onOpenColorPanel={onOpenColorPanel}
            />
          </div>
        </div>

        {selectionPosition?.visible ? (
          <div
            className="pointer-events-auto absolute z-10 -translate-x-1/2"
            style={{ left: selectionPosition.left - position.left, top: selectionPosition.top - position.top }}
          >
            <div className="mt-2 inline-flex items-center gap-1 rounded-2xl border border-slate-300/80 bg-white/98 p-1 shadow-[0_8px_20px_rgba(15,23,42,0.14)] backdrop-blur">
              <button
                type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                onClick={onDuplicate}
                aria-label="Duplicate text box"
                title="Duplicate"
              >
                <MiniActionIcon kind="copy" />
              </button>
              <button
                type="button"
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border shadow-sm ${
                  locked
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
                onClick={onToggleLock}
                aria-label={locked ? "Unlock text box" : "Lock text box"}
                title={locked ? "Unlock" : "Lock"}
              >
                <MiniActionIcon kind={locked ? "unlock" : "lock"} />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-700 shadow-sm hover:bg-rose-50"
                onClick={onDelete}
                aria-label="Delete text box"
                title="Delete"
              >
                <MiniActionIcon kind="delete" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
