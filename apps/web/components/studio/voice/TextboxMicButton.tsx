"use client";

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

export function TextboxMicButton({
  disabled,
  onClick,
  isRecording
}: {
  disabled?: boolean;
  onClick: () => void;
  isRecording: boolean;
}) {
  return (
    <button
      type="button"
      title={disabled ? "Locked" : isRecording ? "Recording active" : "Record voice"}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      className={[
        "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded border text-xs shadow-sm transition",
        isRecording
          ? "border-rose-300 bg-rose-500/20 text-rose-600 animate-pulse"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
        disabled ? "cursor-not-allowed opacity-40" : ""
      ].join(" ")}
      aria-label={isRecording ? "Recording active" : "Record voice"}
    >
      <MicIcon />
    </button>
  );
}
