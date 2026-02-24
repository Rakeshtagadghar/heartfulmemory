import { HeroVisual } from "../hero-visual";
import { MemoriosoMark } from "../memorioso-logo";
import { TrackedLink } from "../tracked-link";
import { heroBullets } from "../../lib/landing-content";

export function HeroSection() {
  return (
    <section id="hero" className="relative mx-auto w-full max-w-7xl px-6 pb-8 pt-6 sm:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_15%_10%,rgba(213,179,106,0.15),transparent_45%),radial-gradient(circle_at_90%_15%,rgba(17,59,52,0.28),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(198,109,99,0.14),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-panel">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="pointer-events-none absolute left-6 top-0 h-px w-40 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="pointer-events-none absolute -right-24 top-12 h-56 w-56 rounded-full border border-gold/20 bg-gold/5 blur-3xl" />
        <div className="mx-auto grid w-full gap-12 px-6 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pt-14">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold/90">
            <MemoriosoMark className="h-6 w-6 rounded-md" />
            Memorioso
          </span>
          <h1 className="mt-6 max-w-xl font-display text-5xl leading-[0.95] text-parchment sm:text-6xl lg:text-7xl">
            Turn family memories into a royal heirloom storybook.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
            Record or write stories. Get guided prompts. Edit chapters. Export a beautiful PDF in minutes.
          </p>

          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {heroBullets.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/85"
              >
                <span className="mt-1 h-2 w-2 rounded-full bg-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              href="/app/start"
              eventName="cta_start_click"
              eventProps={{ section: "hero" }}
              className="group inline-flex h-12 items-center justify-center rounded-xl border border-gold/70 bg-gold px-6 text-sm font-semibold text-ink shadow-glow transition hover:bg-[#e3c17b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Start your Storybook
              <span className="ml-2 transition-transform group-hover:translate-x-0.5">-&gt;</span>
            </TrackedLink>
            <TrackedLink
              href="/gift"
              eventName="cta_gift_click"
              eventProps={{ section: "hero" }}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/[0.03] px-6 text-sm font-semibold text-white transition hover:border-gold/50 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Gift a Storybook
            </TrackedLink>
          </div>

          <p className="mt-6 max-w-xl text-sm leading-6 text-white/55">
            Inspired by modern memoir services that preserve stories with prompts, recordings, and keepsake books.
          </p>
        </div>

        <HeroVisual />
        </div>
      </div>
    </section>
  );
}
