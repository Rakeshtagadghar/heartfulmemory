"use client";

import { getVoiceErrorCopy } from "../../lib/voice/errors/voiceErrorCopy";
import type { VoicePreflightResult } from "../../lib/voice/preflight";

export function MicAvailabilityBadge({
  preflight,
  onOpenMicHelp
}: {
  preflight: VoicePreflightResult | null;
  onOpenMicHelp?: () => void;
}) {
  if (!preflight) return null;

  if (preflight.ready) {
    return (
      <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100/85">
        Microphone ready.
      </div>
    );
  }

  if (preflight.permissionState === "prompt") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
        We will ask for microphone access only when you press Start.
      </div>
    );
  }

  const copy = preflight.code ? getVoiceErrorCopy(preflight.code) : null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-3 text-xs text-amber-50/90 sm:flex-row sm:items-center sm:justify-between">
      <span>{copy?.description ?? preflight.description ?? "Microphone setup needs attention."}</span>
      {onOpenMicHelp ? (
        <button
          type="button"
          onClick={onOpenMicHelp}
          className="cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-white/80 transition hover:bg-white/[0.05]"
        >
          Help
        </button>
      ) : null}
    </div>
  );
}
