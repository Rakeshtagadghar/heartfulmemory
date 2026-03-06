"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

const browserSteps = [
  {
    label: "Chrome or Edge",
    steps: [
      "Open the site settings from the lock icon near the address bar.",
      "Set Microphone to Allow.",
      "Refresh the page, then try the microphone again."
    ]
  },
  {
    label: "Safari",
    steps: [
      "Open Safari Settings, then Websites.",
      "Choose Microphone and allow this site.",
      "Refresh the page, then try again."
    ]
  }
];

const extraTips = [
  "If another app is using the microphone, close that app and try again.",
  "If the wrong microphone is selected, change the input device in your computer sound settings.",
  "You can keep your story moving by typing instead at any time."
];

export function MicHelpModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0b1320] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
        <p className="text-xs uppercase tracking-[0.14em] text-gold/90">Microphone help</p>
        <h3 className="mt-2 text-2xl font-semibold text-parchment">Get voice recording working again</h3>
        <div className="mt-5 space-y-4 text-sm leading-7 text-white/80">
          {browserSteps.map((group) => (
            <div key={group.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-semibold text-white">{group.label}</p>
              <ol className="mt-2 space-y-1 text-white/75">
                {group.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="font-semibold text-white">If the microphone is busy or missing</p>
            <ul className="mt-2 space-y-1 text-white/75">
              {extraTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6">
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-gold/55 bg-gold/90 px-4 py-2 text-sm font-semibold text-ink hover:bg-[#e3c17b]"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
