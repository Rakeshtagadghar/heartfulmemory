import { howItWorks } from "../../lib/landing-content";
import { ViewportEvent } from "../viewport-event";
import { SectionShell } from "./primitives";

export function HowItWorksSection() {
  return (
    <SectionShell
      id="how_it_works"
      title="How it works"
      kicker="Simple in four steps"
      theme="emerald"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {howItWorks.map((step, index) => (
          <div
            key={step.title}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-5 shadow-panel"
          >
            <ViewportEvent eventName="how_it_works_step_view" eventProps={{ step_index: index }} once={false} />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-gold/50 to-transparent" />
            <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-sm font-semibold text-gold">
              {index + 1}
            </div>
            <h3 className="text-lg font-semibold text-parchment">{step.title}</h3>
            <p className="mt-2 text-sm leading-7 text-white/70">{step.desc}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
