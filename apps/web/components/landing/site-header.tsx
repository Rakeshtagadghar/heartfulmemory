import { brand } from "../../content/landingContent";
import { MemoriosoLogo } from "../memorioso-logo";
import { TrackedLink } from "../tracked-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] shadow-[0_12px_40px_rgba(4,10,20,0.35)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="pointer-events-none absolute left-8 top-0 h-px w-28 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <div className="pointer-events-none absolute -right-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-gold/20 bg-gold/10 blur-xl" />
          <div className="relative mx-auto flex w-full items-center justify-between px-4 py-3 sm:px-6">
            <MemoriosoLogo />

            <nav className="hidden items-center gap-1 text-sm md:flex">
              {brand.navLabels.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="rounded-lg px-3 py-2 text-white/75 transition hover:bg-white/[0.05] hover:text-white"
                >
                  {label}
                </a>
              ))}
            </nav>

            <TrackedLink
              href="/app/start"
              eventName="cta_start_click"
              eventProps={{ section: "header" }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-gold/60 bg-gold px-4 text-sm font-semibold text-ink shadow-[0_8px_24px_rgba(213,179,106,0.22)] transition hover:bg-[#e3c17b]"
            >
              Start
            </TrackedLink>
          </div>
        </div>
      </div>
    </header>
  );
}
