"use client";

export function PopulateProgress({
  error,
  onRetry
}: {
  error?: string | null;
  onRetry?: () => void;
}) {
  if (error) {
    return (
      <div className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-4">
        <p className="text-sm font-semibold text-rose-100">Could not prepare your studio</p>
        <p className="mt-1 text-sm text-rose-100/70">{error}</p>
        <div className="mt-3 flex gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg border border-rose-300/30 px-3 py-1.5 text-sm font-semibold text-rose-100 hover:bg-rose-400/10"
            >
              Retry
            </button>
          ) : null}
          <a
            href="mailto:support@heartfulmemory.com"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/60 hover:text-white/80"
          >
            Contact support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4">
      <svg
        className="h-5 w-5 animate-spin text-cyan-300"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm font-semibold text-cyan-100">Preparing your studio…</p>
    </div>
  );
}
