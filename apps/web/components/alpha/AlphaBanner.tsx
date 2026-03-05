"use client";

import { useEffect, useState } from "react";
import { alphaMessaging } from "../../content/alphaMessaging";

const DISMISS_KEY = "memorioso.alpha_banner_dismissed_at";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

export function AlphaBanner({
  onLearnMore
}: {
  onLearnMore: () => void;
}) {
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const frame = globalThis.requestAnimationFrame(() => {
      try {
        const raw = globalThis.localStorage.getItem(DISMISS_KEY);
        if (!raw) {
          setVisible(true);
          return;
        }
        const dismissedAt = Number(raw);
        if (!Number.isFinite(dismissedAt)) {
          globalThis.localStorage.removeItem(DISMISS_KEY);
          setVisible(true);
          return;
        }
        const stillDismissed = Date.now() - dismissedAt < DISMISS_MS;
        if (!stillDismissed) {
          globalThis.localStorage.removeItem(DISMISS_KEY);
        }
        setVisible(!stillDismissed);
      } catch {
        setVisible(true);
      }
    });
    return () => {
      globalThis.cancelAnimationFrame(frame);
    };
  }, []);

  if (visible !== true) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium">
          {alphaMessaging.alphaBlurbShort}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-md border border-amber-200/40 px-2 py-1 text-xs font-semibold text-amber-50 hover:bg-amber-100/10"
            onClick={onLearnMore}
          >
            {alphaMessaging.alphaInfoLinkLabel}
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-md border border-white/15 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
            onClick={() => {
              try {
                globalThis.localStorage.setItem(DISMISS_KEY, String(Date.now()));
              } catch {
                // Ignore storage failures and still hide this session.
              }
              setVisible(false);
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
