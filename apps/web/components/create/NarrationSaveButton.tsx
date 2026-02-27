"use client";

import { useFormStatus } from "react-dom";

export function NarrationSaveButton({ saved = false }: { saved?: boolean }) {
  const { pending } = useFormStatus();
  const showSaved = saved && !pending;
  let statusIcon = null;
  if (pending) {
    statusIcon = (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 animate-spin"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-3.2-6.9" />
      </svg>
    );
  } else if (showSaved) {
    statusIcon = (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m5 12 4 4 10-10" />
      </svg>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        aria-live="polite"
        className="inline-flex h-5 w-5 items-center justify-center text-emerald-200"
      >
        {statusIcon}
      </span>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/[0.03] px-0 text-white transition hover:border-gold/45 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-70"
        aria-label="Save narration settings"
        title="Save narration settings"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 4h11l3 3v13H5z" />
          <path d="M8 4v5h7V4" />
          <path d="M8 20v-6h8v6" />
        </svg>
      </button>
    </div>
  );
}
