import { TrackedLink } from "../tracked-link";

export function RoadmapBanner() {
  return (
    <section id="qr_teaser" className="mx-auto w-full max-w-7xl px-6 py-5 sm:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-[radial-gradient(circle_at_15%_20%,rgba(17,59,52,0.52),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(213,179,106,0.14),transparent_40%),radial-gradient(circle_at_70%_100%,rgba(198,109,99,0.14),transparent_45%),linear-gradient(135deg,rgba(15,30,53,0.92),rgba(10,19,33,0.96))] p-6 shadow-panel sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute right-[-18%] top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-gold/25 bg-gold/5 blur-2xl" />
        <div className="absolute left-8 top-0 h-px w-36 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <span className="inline-flex rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          Roadmap
        </span>
        <div className="relative mt-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl leading-tight text-parchment sm:text-4xl">Scan-to-relive (coming next)</h2>
            <p className="mt-3 text-sm leading-7 text-white/80 sm:text-base">
              Future chapters can include QR codes so readers can hear the original voice behind each story.
            </p>
          </div>
          <TrackedLink
            href="#email_capture"
            eventName="email_capture_focus"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-gold/70 bg-gold px-5 text-sm font-semibold text-ink transition hover:bg-[#e3c17b]"
          >
            Join the waitlist
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
