type MemoriosoLogoProps = {
  className?: string;
  compact?: boolean;
  subtitle?: string;
};

export function MemoriosoLogo({
  className = "",
  compact = false,
  subtitle = "Heirloom Storybooks"
}: MemoriosoLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <MemoriosoMark className={compact ? "h-10 w-10" : "h-11 w-11"} />
      <div>
        <p className="font-display text-xl leading-none text-parchment">
          Memorioso
        </p>
        {!compact ? (
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function MemoriosoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative grid place-items-center rounded-xl border border-gold/35 bg-gradient-to-br from-gold/20 via-white/5 to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${className}`.trim()}
    >
      <span className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_32%_20%,rgba(213,179,106,0.28),transparent_55%)]" />
      <svg
        viewBox="0 0 64 64"
        className="relative h-[70%] w-[70%] text-parchment"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M32 8c8 6 16 6 20 6v18c0 13-9 20-20 24C21 52 12 45 12 32V14c4 0 12 0 20-6Z" opacity="0.4" />
        <path d="M22 42V22l10 12 10-12v20" />
        <path d="M22 42h20" opacity="0.75" />
        <path d="M16 18c-2 3-3 7-3 11" opacity="0.45" />
        <path d="M48 18c2 3 3 7 3 11" opacity="0.45" />
      </svg>
    </span>
  );
}

