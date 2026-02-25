"use client";

import { useEffect, useRef } from "react";

export function ElementContextMenu({
  open,
  x,
  y,
  onClose,
  onDuplicate,
  onDelete,
  onToggleLock,
  onBringForward,
  onSendBackward,
  onReplaceImage,
  locked
}: {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onReplaceImage?: () => void;
  locked: boolean;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      onClose();
    }
    globalThis.addEventListener("keydown", onKeyDown);
    globalThis.addEventListener("pointerdown", onPointerDown);
    return () => {
      globalThis.removeEventListener("keydown", onKeyDown);
      globalThis.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Element actions"
      className="pointer-events-auto absolute z-40 min-w-56 rounded-2xl border border-white/15 bg-[#0c1422]/95 p-2 shadow-2xl backdrop-blur-xl"
      style={{ left: x, top: y }}
    >
      <div className="space-y-1">
        {onReplaceImage ? (
          <>
            <button
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-white/90 hover:bg-white/[0.06]"
              onClick={() => {
                onReplaceImage();
                onClose();
              }}
            >
              <span>Replace image</span>
              <span aria-hidden className="text-white/45">IMG</span>
            </button>
            <div className="my-1 h-px bg-white/10" />
          </>
        ) : null}
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-white/90 hover:bg-white/[0.06]"
          onClick={() => {
            onBringForward();
            onClose();
          }}
        >
          <span>Bring forward</span>
          <span aria-hidden className="text-white/45">UP</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-white/90 hover:bg-white/[0.06]"
          onClick={() => {
            onSendBackward();
            onClose();
          }}
        >
          <span>Send backward</span>
          <span aria-hidden className="text-white/45">DOWN</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-white/90 hover:bg-white/[0.06]"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
        >
          <span>Duplicate</span>
          <span aria-hidden className="text-white/45">D</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-white/90 hover:bg-white/[0.06]"
          onClick={() => {
            onToggleLock();
            onClose();
          }}
        >
          <span>{locked ? "Unlock" : "Lock"}</span>
          <span aria-hidden className="text-white/45">{locked ? "UN" : "LK"}</span>
        </button>
      </div>
      <div className="my-2 h-px bg-white/10" />
      <button
        type="button"
        role="menuitem"
        className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-rose-200 hover:bg-rose-500/10"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <span>Delete</span>
        <span aria-hidden className="text-rose-200/70">DEL</span>
      </button>
    </div>
  );
}

