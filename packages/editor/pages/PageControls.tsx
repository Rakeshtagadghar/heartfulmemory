"use client";

import type { ReactNode } from "react";

function ControlButton({
  label,
  disabled = false,
  onClick,
  children
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#555963] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-35"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function PageControls({
  canMoveUp,
  canMoveDown,
  isHidden,
  isLocked,
  onMoveUp,
  onMoveDown,
  onToggleHidden,
  onToggleLocked,
  onDelete,
  onAddPageAfter
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  isHidden: boolean;
  isLocked: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleHidden: () => void;
  onToggleLocked: () => void;
  onDelete: () => void;
  onAddPageAfter: () => void;
}) {
  return (
    <div className="flex items-center gap-1 text-[#59606b]">
      <ControlButton label="Move page up" disabled={!canMoveUp} onClick={onMoveUp}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m6 14 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </ControlButton>
      <ControlButton label="Move page down" disabled={!canMoveDown} onClick={onMoveDown}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m6 10 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </ControlButton>
      <ControlButton label={isHidden ? "Show page" : "Hide page"} onClick={onToggleHidden}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path
            d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.8" />
          {isHidden ? <path d="m4 20 16-16" strokeLinecap="round" /> : null}
        </svg>
      </ControlButton>
      <ControlButton label={isLocked ? "Unlock page" : "Lock page"} onClick={onToggleLocked}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="5.5" y="11" width="13" height="9" rx="2" />
          <path d="M8.5 11V8.8a3.5 3.5 0 0 1 7 0V11" strokeLinecap="round" />
          {isLocked ? null : <path d="M12 14.6v2.6" strokeLinecap="round" />}
        </svg>
      </ControlButton>
      <ControlButton label="Delete page" onClick={onDelete}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16" strokeLinecap="round" />
          <path d="M9.2 7V5.7c0-.7.6-1.2 1.2-1.2h3.2c.7 0 1.2.6 1.2 1.2V7" />
          <path d="M7.2 7 8 19a1.8 1.8 0 0 0 1.8 1.7h4.4A1.8 1.8 0 0 0 16 19l.8-12" />
        </svg>
      </ControlButton>
      <ControlButton label="Add page after" onClick={onAddPageAfter}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M8 4h8v5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 20h8a2 2 0 0 0 2-2v-4" strokeLinecap="round" />
          <path d="M6 12h12" strokeLinecap="round" />
          <path d="M12 6v12" strokeLinecap="round" />
        </svg>
      </ControlButton>
    </div>
  );
}
