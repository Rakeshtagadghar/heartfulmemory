"use client";

export type OrientationWarning = {
  nodeId: string;
  pageId: string;
  label: string;
  kind: "text-overflow" | "crop-reset";
};

type Props = {
  warnings: OrientationWarning[];
  onDismiss: () => void;
  onFocusNode?: (nodeId: string, pageId: string) => void;
};

/**
 * Dismissible panel showing warnings after an orientation reflow.
 * Lists text overflow and crop reset issues with click-to-focus links.
 */
export function OrientationWarningsPanel({ warnings, onDismiss, onFocusNode }: Props) {
  if (warnings.length === 0) return null;

  return (
    <div className="absolute bottom-16 left-1/2 z-40 w-full max-w-sm -translate-x-1/2 rounded-xl border border-amber-500/30 bg-[#0d1626] px-4 py-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-400">
          Reflow Warnings ({warnings.length})
        </h3>
        <button
          type="button"
          className="cursor-pointer text-xs text-white/50 transition hover:text-white"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
      <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto text-xs text-white/70">
        {warnings.map((w) => (
          <li key={`${w.nodeId}-${w.kind}`} className="flex items-center gap-2">
            <span className={w.kind === "text-overflow" ? "text-amber-400" : "text-cyan-400"}>
              {w.kind === "text-overflow" ? "Overflow" : "Crop reset"}
            </span>
            <span className="truncate">{w.label}</span>
            {onFocusNode && (
              <button
                type="button"
                className="cursor-pointer ml-auto shrink-0 text-cyan-400 underline transition hover:text-cyan-300"
                onClick={() => onFocusNode(w.nodeId, w.pageId)}
              >
                Focus
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
