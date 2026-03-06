"use client";

import { getVoiceErrorCopy } from "../../lib/voice/errors/voiceErrorCopy";
import { normalizeVoiceErrorCode } from "../../lib/voice/errors/voiceErrorCodes";

export type VoiceErrorCardAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

function actionClassName(variant: VoiceErrorCardAction["variant"]) {
  if (variant === "ghost") {
    return "border-white/12 text-white/70 hover:bg-white/[0.04]";
  }
  if (variant === "secondary") {
    return "border-white/16 bg-white/[0.04] text-white/85 hover:bg-white/[0.07]";
  }
  return "border-rose-300/30 bg-rose-400/15 text-rose-50 hover:bg-rose-400/20";
}

export function VoiceErrorCard({
  code,
  actions,
  className = ""
}: {
  code?: string | null;
  actions?: VoiceErrorCardAction[];
  className?: string;
}) {
  const normalized = normalizeVoiceErrorCode(code ?? null);
  const copy = getVoiceErrorCopy(normalized);

  return (
    <div className={`rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 ${className}`.trim()}>
      <p className="text-sm font-semibold text-rose-100">{copy.title}</p>
      <p className="mt-2 text-sm leading-6 text-rose-100/90">{copy.description}</p>
      {actions && actions.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {actions.map((action) => (
            <button
              key={`${normalized}:${action.label}`}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${actionClassName(action.variant)}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
