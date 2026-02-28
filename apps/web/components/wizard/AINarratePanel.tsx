"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "preview" | "error";

export function AINarratePanel({
  answerText,
  questionPrompt,
  chapterTitle,
  onAccept
}: {
  answerText: string;
  questionPrompt: string;
  chapterTitle: string;
  onAccept: (narratedText: string) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleNarrate() {
    const trimmed = answerText.trim();
    if (!trimmed) return;
    setStatus("loading");
    setError(null);
    setPreviewText(null);

    try {
      const response = await fetch("/api/ai/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionPrompt, answerText: trimmed, chapterTitle })
      });
      const data = await response.json() as { ok: boolean; narratedText?: string; error?: string };
      if (!data.ok || !data.narratedText) {
        setError(data.error ?? "AI narrate failed. Please try again.");
        setStatus("error");
        return;
      }
      setPreviewText(data.narratedText);
      setStatus("preview");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  function handleAccept() {
    if (previewText) {
      onAccept(previewText);
    }
    setStatus("idle");
    setPreviewText(null);
  }

  function handleDismiss() {
    setStatus("idle");
    setPreviewText(null);
    setError(null);
  }

  const canNarrate = answerText.trim().length > 0;

  return (
    <div className="space-y-3">
      {status === "idle" || status === "error" ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!canNarrate}
            onClick={() => { void handleNarrate(); }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/[0.07] px-3 py-1.5 text-xs font-semibold text-gold/90 transition hover:border-gold/50 hover:bg-gold/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 3.5v3.19l2.28 2.28-.53.53-2.5-2.5V4.5h.75z" />
            </svg>
            AI narrate
          </button>
          {status === "error" && error ? (
            <p className="text-xs text-rose-300">{error}</p>
          ) : (
            <p className="text-xs text-white/35">Rephrase your answer into memoir prose</p>
          )}
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="flex items-center gap-2 text-xs text-white/50">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 animate-spin fill-current">
            <path d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8V2z" />
          </svg>
          Narrating…
        </div>
      ) : null}

      {status === "preview" && previewText ? (
        <div className="rounded-2xl border border-gold/20 bg-gold/[0.04] p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold/70">AI narrate preview</p>
          <p className="text-sm leading-7 text-white/85">{previewText}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="inline-flex h-8 items-center rounded-lg border border-gold/40 bg-gold/10 px-3 text-xs font-semibold text-gold transition hover:bg-gold/20"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex h-8 items-center rounded-lg border border-white/15 px-3 text-xs font-semibold text-white/60 transition hover:bg-white/[0.05]"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
