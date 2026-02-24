import { templates } from "../../lib/landing-content";
import { TrackedLink } from "../tracked-link";
import { SectionShell } from "./primitives";

export function TemplatesSection() {
  return (
    <SectionShell
      id="templates"
      title="Start faster with story templates"
      kicker="Choose a guided path, then personalize it"
      theme="rose"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {templates.map((item) => (
          <article
            key={item.name}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">
              Template
            </p>
            <h3 className="mt-2 text-xl font-semibold text-parchment">
              {item.name}
            </h3>
            <div className="mt-6 flex items-center gap-2 text-sm text-white/70">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                {item.chapters} chapters
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                {item.minutesToStart} min start
              </span>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6">
        <TrackedLink
          href="/templates"
          eventName="cta_templates_click"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-5 text-sm font-semibold text-white transition hover:border-gold/40"
        >
          Browse templates
        </TrackedLink>
      </div>
    </SectionShell>
  );
}
