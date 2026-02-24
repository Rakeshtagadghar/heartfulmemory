type SectionTheme =
  | "emerald"
  | "navy"
  | "rose"
  | "gold"
  | "midnight"
  | "pearl";

export function SectionShell({
  id,
  title,
  kicker,
  children,
  theme = "midnight",
  className
}: {
  id: string;
  title: string;
  kicker: string;
  children: React.ReactNode;
  theme?: SectionTheme;
  className?: string;
}) {
  const themeClasses: Record<SectionTheme, string> = {
    emerald:
      "border-emerald/30 bg-[radial-gradient(circle_at_10%_15%,rgba(17,59,52,0.55),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(213,179,106,0.14),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]",
    navy:
      "border-white/10 bg-[radial-gradient(circle_at_15%_10%,rgba(37,78,139,0.2),transparent_40%),radial-gradient(circle_at_85%_85%,rgba(213,179,106,0.1),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))]",
    rose:
      "border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(198,109,99,0.18),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(213,179,106,0.12),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))]",
    gold:
      "border-gold/20 bg-[radial-gradient(circle_at_20%_0%,rgba(213,179,106,0.18),transparent_45%),radial-gradient(circle_at_90%_80%,rgba(17,59,52,0.2),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
    midnight:
      "border-white/10 bg-[radial-gradient(circle_at_5%_10%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_95%_15%,rgba(213,179,106,0.08),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]",
    pearl:
      "border-white/10 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.07),transparent_42%),radial-gradient(circle_at_90%_20%,rgba(198,109,99,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))]"
  };

  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:py-10 ${className ?? ""}`}
    >
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 shadow-panel sm:p-8 ${themeClasses[theme]}`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="pointer-events-none absolute -right-10 top-6 h-24 w-24 rounded-full border border-gold/20 bg-gold/5 blur-xl" />
        <div className="pointer-events-none absolute left-10 top-0 h-px w-32 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        <div className="relative mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-gold/90">{kicker}</p>
          <h2 className="mt-2 font-display text-3xl leading-tight text-parchment sm:text-4xl">
            {title}
          </h2>
        </div>
        <div className="relative">{children}</div>
      </div>
    </section>
  );
}

export function BackgroundOrbs() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-95" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_50%_0%,rgba(213,179,106,0.08),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_50%_100%,rgba(17,59,52,0.1),transparent_70%)]" />
      <div className="pointer-events-none absolute -left-20 top-28 h-72 w-72 animate-float rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-4rem] top-48 h-80 w-80 animate-float rounded-full bg-emerald/20 blur-3xl [animation-delay:1.5s]" />
      <div className="pointer-events-none absolute bottom-52 left-1/3 h-96 w-96 animate-float rounded-full bg-blush/10 blur-3xl [animation-delay:2.5s]" />
      <div className="pointer-events-none absolute bottom-16 right-1/4 h-56 w-56 animate-float rounded-full bg-[#2a4f86]/10 blur-3xl [animation-delay:3.4s]" />
    </>
  );
}
