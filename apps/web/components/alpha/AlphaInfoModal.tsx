"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { alphaMessaging } from "../../content/alphaMessaging";
import { SUPPORT_CONTACT_PATH } from "../../lib/support/contact";

export function AlphaInfoModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    globalThis.addEventListener("keydown", onKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1320] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
        <p className="text-xs uppercase tracking-[0.14em] text-amber-200/90">
          {alphaMessaging.alphaBadge}
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-parchment">
          {alphaMessaging.alphaInfoTitle}
        </h3>
        <ul className="mt-4 space-y-2 text-sm leading-7 text-white/80">
          {alphaMessaging.alphaInfoBody.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="mt-3 h-1.5 w-1.5 rounded-full bg-amber-200" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-white/70">
          Share feedback anytime at{" "}
          <a href={SUPPORT_CONTACT_PATH} className="text-gold hover:text-[#e8cc95]">
            our contact page
          </a>
          .
        </p>
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

