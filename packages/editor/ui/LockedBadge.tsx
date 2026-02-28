"use client";

export function LockedBadge({ label = "Locked" }: { label?: string }) {
  return (
    <span className="absolute right-2 top-2 rounded bg-black/45 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/75">
      {label}
    </span>
  );
}
