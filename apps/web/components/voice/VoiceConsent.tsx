"use client";

import Link from "next/link";
import { useState } from "react";

export function VoiceConsent({
  onAccept
}: {
  onAccept: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-sm font-semibold text-white/90">Voice recording and transcription notice</p>
      <p className="mt-2 text-sm leading-6 text-white/70">
        Your voice will be recorded only after you press Start, then sent to a transcription service to create text you can review and edit.
      </p>
      <p className="mt-2 text-xs leading-5 text-white/55">
        Sprint 18 uses a privacy-first mode: transcript text is saved, audio is not stored after transcription.
      </p>

      <label className="mt-4 flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
        />
        <span className="text-sm text-white/80">I understand and want to use voice transcription.</span>
      </label>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 text-xs">
          <Link href="/privacy" className="text-white/60 hover:text-white/85">
            Privacy
          </Link>
          <Link href="/terms" className="text-white/60 hover:text-white/85">
            Terms
          </Link>
        </div>
        <button
          type="button"
          disabled={!checked}
          onClick={onAccept}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-gold/55 bg-gold/90 px-4 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue to Voice Recording
        </button>
      </div>
    </div>
  );
}

