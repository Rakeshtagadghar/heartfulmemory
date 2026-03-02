"use client";

export function OrientationConfirmModal({
  targetOrientation,
  onConfirm,
  onCancel
}: {
  targetOrientation: "portrait" | "landscape";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const label = targetOrientation === "landscape" ? "Landscape" : "Portrait";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="orientation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1626] px-6 py-5 shadow-2xl">
        <h2
          id="orientation-modal-title"
          className="mb-2 text-base font-semibold text-white"
        >
          Switch to {label}?
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-white/70">
          Your content will be adjusted to fit the {label.toLowerCase()} layout.
          Some items may shift position to stay within the safe area.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.10] hover:text-white"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400"
            onClick={onConfirm}
          >
            Apply &amp; Auto-fit
          </button>
        </div>
      </div>
    </div>
  );
}
