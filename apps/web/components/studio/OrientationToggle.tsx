"use client";

import type { MouseEvent as ReactMouseEvent } from "react";

export function OrientationToggle({
  orientation,
  onClick
}: {
  orientation: "portrait" | "landscape";
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  const label = `Orientation: ${orientation === "landscape" ? "Landscape" : "Portrait"}`;

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/75 transition hover:bg-white/[0.06] hover:text-white"
        onClick={onClick}
      >
        {orientation === "portrait" ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="6" y="3" width="12" height="18" rx="1.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="6" width="18" height="12" rx="1.5" />
          </svg>
        )}
      </button>
      <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#0a111d]/95 px-2 py-1 text-[10px] text-white/90 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </div>
    </div>
  );
}
