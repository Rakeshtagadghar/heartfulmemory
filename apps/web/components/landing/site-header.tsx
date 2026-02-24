import { MemoriosoLogo } from "../memorioso-logo";
import { TrackedLink } from "../tracked-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        <MemoriosoLogo />

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {[
            ["#how_it_works", "How it works"],
            ["#templates", "Templates"],
            ["#pricing", "Pricing"],
            ["#faq", "FAQ"]
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-white/75 transition hover:bg-white/[0.04] hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        <TrackedLink
          href="/app/start"
          eventName="cta_start_click"
          eventProps={{ section: "header" }}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-gold/60 bg-gold px-4 text-sm font-semibold text-ink transition hover:bg-[#e3c17b]"
        >
          Start
        </TrackedLink>
      </div>
    </header>
  );
}
