import { features } from "../../lib/landing-content";
import { SectionShell } from "./primitives";
import { FeatureIcon } from "./feature-icon";

export function FeatureGridSection() {
  return (
    <SectionShell
      id="feature_grid"
      title="Everything you need to start (Phase 1)"
      kicker="Built for memory capture, not busywork"
      theme="navy"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition hover:-translate-y-1 hover:border-gold/35"
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
              <FeatureIcon name={feature.icon} />
            </div>
            <h3 className="text-base font-semibold text-parchment">{feature.title}</h3>
            <p className="mt-2 text-sm leading-7 text-white/70">{feature.desc}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
