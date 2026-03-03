"use client";

import type { VoiceSessionState } from "./voiceStates";

const CONFIG: Record<VoiceSessionState, { label: string; className: string }> = {
  idle: {
    label: "Ready",
    className: "border-white/10 text-white/55"
  },
  listening: {
    label: "Listening\u2026",
    className: "border-rose-300/30 bg-rose-400/10 text-rose-200 animate-pulse"
  },
  processing: {
    label: "Processing\u2026",
    className: "border-amber-300/30 bg-amber-400/10 text-amber-200"
  },
  success: {
    label: "Inserted",
    className: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
  },
  error: {
    label: "Error",
    className: "border-rose-500/40 bg-rose-500/10 text-rose-300"
  }
};

export function VoiceStatusPill({ state }: { state: VoiceSessionState }) {
  const config = CONFIG[state];
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold ${config.className}`}
    >
      {state === "processing" && (
        <span className="mr-1.5 inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {config.label}
    </span>
  );
}
