"use client";

import type { PageViewMode } from "../../../../packages/editor/pages/viewMode";

export function PagesToggle({
  mode,
  onToggle
}: {
  mode: PageViewMode;
  onToggle: () => void;
}) {
  const active = mode === "single_page";

  return (
    <button
      type="button"
      aria-pressed={active}
      className={[
        "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-cyan-300/40 bg-cyan-400/12 text-cyan-100"
          : "border-white/12 bg-white/[0.03] text-white/80 hover:bg-white/[0.06] hover:text-white"
      ].join(" ")}
      onClick={onToggle}
    >
      <span>Pages</span>
    </button>
  );
}
