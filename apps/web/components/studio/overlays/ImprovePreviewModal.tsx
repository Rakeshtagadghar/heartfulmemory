"use client";

type Props = {
  actionLabel: string;
  original: string;
  improved: string | null;
  loading: boolean;
  onAccept: () => void;
  onCancel: () => void;
};

export function ImprovePreviewModal({ actionLabel, original, improved, loading, onAccept, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span aria-hidden="true">✦</span> AI Improve — {actionLabel}
          </span>
          <button type="button" onClick={onCancel}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>

        {/* Two-column content */}
        <div className="grid max-h-[60vh] grid-cols-2 divide-x divide-gray-100 overflow-auto">
          <div className="p-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Original</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{original}</p>
          </div>
          <div className="p-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">AI Improved</p>
            {loading ? (
              <div className="flex items-center gap-2 pt-1 text-gray-400">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
                <span className="text-sm">Generating…</span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">{improved ?? ""}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onCancel}
            className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={onAccept} disabled={loading || !improved}
            className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40">
            Accept &amp; Replace
          </button>
        </div>

      </div>
    </div>
  );
}
