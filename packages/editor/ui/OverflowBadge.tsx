"use client";

type Props = {
  /** When true, shows the overflow warning badge. */
  visible: boolean;
  className?: string;
};

/**
 * OverflowBadge
 *
 * Small warning indicator displayed on a Studio text frame when its
 * content height exceeds the frame bounds.
 */
export function OverflowBadge({ visible, className }: Props) {
  if (!visible) return null;

  return (
    <div
      title="Text overflows frame — shorten content or resize the frame"
      className={[
        "inline-flex items-center gap-1 rounded-md bg-amber-500/90 px-1.5 py-0.5",
        "text-[10px] font-bold uppercase tracking-wide text-black/80 shadow",
        className ?? ""
      ].join(" ")}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="h-3 w-3 fill-current"
      >
        <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 5Zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
      </svg>
      Overflow
    </div>
  );
}
