import { pricingPlans } from "../../lib/landing-content";
import { TrackedLink } from "../tracked-link";
import { SectionShell } from "./primitives";

export function PricingSection() {
  return (
    <SectionShell
      id="pricing"
      title="Simple pricing"
      kicker="Start free. Upgrade to export when ready."
      theme="gold"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {pricingPlans.map((plan, index) => (
          <div
            key={plan.id}
            className={`relative overflow-hidden rounded-2xl border p-6 ${
              index === 1
                ? "border-gold/40 bg-gradient-to-b from-gold/10 to-white/[0.02] shadow-glow"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            {index === 1 ? (
              <span className="absolute right-4 top-4 rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-gold">
                Popular gift
              </span>
            ) : null}
            <h3 className="text-xl font-semibold text-parchment">{plan.name}</h3>
            <div className="mt-3 flex items-end gap-2">
              <p className="font-display text-4xl leading-none text-parchment">
                {plan.price}
              </p>
              {plan.period ? (
                <p className="pb-1 text-sm text-white/55">{plan.period}</p>
              ) : null}
            </div>
            <ul className="mt-5 space-y-3 text-sm text-white/75">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gold" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <TrackedLink
              href={plan.href}
              eventName="pricing_plan_select"
              eventProps={{ plan_id: plan.id }}
              className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl border text-sm font-semibold transition ${
                index !== 0
                  ? "border-gold/65 bg-gold text-ink hover:bg-[#e3c17b]"
                  : "border-white/15 bg-white/[0.03] text-white hover:border-gold/40"
              }`}
            >
              {plan.cta}
            </TrackedLink>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-white/55">
        Pro includes up to 100 PDF exports per month and hardcopy-ready output.
      </p>
    </SectionShell>
  );
}
