"use client";

import { alphaMessaging } from "../../content/alphaMessaging";

export function AlphaBadge({
  onLearnMore
}: {
  onLearnMore: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-100">
      <span>{alphaMessaging.alphaBadge}</span>
      <button
        type="button"
        className="cursor-pointer normal-case text-[10px] font-medium tracking-normal text-amber-50 underline decoration-amber-200/60 underline-offset-2 hover:text-white"
        onClick={onLearnMore}
      >
        {alphaMessaging.alphaInfoLinkLabel}
      </button>
    </div>
  );
}

