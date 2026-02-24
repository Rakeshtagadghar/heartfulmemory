import type { HeroSplitBlock } from "../../../content/landing.schema";
import { HeroVisual } from "../../hero-visual";
import { MediaMock } from "../MediaMock";
import { MemoriosoMark } from "../../memorioso-logo";
import { TrackedLink } from "../../tracked-link";
import { buttonClassName } from "../../ui/button";
import { Badge } from "../../ui/badge";

export function HeroSplit({ block }: { block: HeroSplitBlock }) {
  const { content } = block;
  const ctas = content.ctas ?? [];
  const visual = content.visual;

  return (
    <section id={block.id} className="relative mx-auto w-full max-w-7xl px-6 pb-8 pt-4 sm:px-8 sm:pt-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_15%_10%,rgba(213,179,106,0.15),transparent_45%),radial-gradient(circle_at_90%_15%,rgba(17,59,52,0.28),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(198,109,99,0.14),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-panel">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="pointer-events-none absolute left-6 top-0 h-px w-40 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="pointer-events-none absolute -right-24 top-12 h-56 w-56 rounded-full border border-gold/20 bg-gold/5 blur-3xl" />
        <div className="mx-auto grid w-full gap-12 px-6 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pt-14">
          <div className="animate-rise">
            {content.badge ? (
              <Badge className="bg-white/5">
                <MemoriosoMark className="h-6 w-6 rounded-md" />
                {content.badge}
              </Badge>
            ) : null}

            <h1 className="mt-6 max-w-xl font-display text-5xl leading-[0.95] text-parchment sm:text-6xl lg:text-7xl">
              {content.headline}
            </h1>

            {content.subheadline ? (
              <p className="mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
                {content.subheadline}
              </p>
            ) : null}

            {content.bullets?.length ? (
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {content.bullets.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/85"
                  >
                    <span className="mt-1 h-2 w-2 rounded-full bg-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {ctas.length ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {ctas.map((cta, index) => (
                  <TrackedLink
                    key={`${cta.label}-${index}`}
                    href={cta.href}
                    eventName={cta.eventName}
                    eventProps={cta.eventProps}
                    className={buttonClassName({
                      variant: cta.variant ?? (index === 0 ? "primary" : "secondary"),
                      size: "lg",
                      className: "w-full sm:w-auto"
                    })}
                  >
                    <span>{cta.label}</span>
                    {index === 0 ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 10h12" />
                        <path d="m10 5 5 5-5 5" />
                      </svg>
                    ) : null}
                  </TrackedLink>
                ))}
              </div>
            ) : null}

            {content.socialProof ? (
              <p className="mt-6 max-w-xl text-sm leading-6 text-white/55">
                {content.socialProof}
              </p>
            ) : null}
          </div>

          {visual?.type === "media_mock" ? (
            <MediaMock items={visual.items ?? []} />
          ) : (
            <HeroVisual />
          )}
        </div>
      </div>
    </section>
  );
}
