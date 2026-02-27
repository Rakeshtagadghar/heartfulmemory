import type {
  CarouselBlock,
  EmailCaptureBlock,
  FaqBlock,
  FeatureGridBlock,
  FooterBlock,
  HighlightBannerBlock,
  PricingCardsBlock,
  StepperBlock,
  TestimonialsBlock
} from "../../../content/landing.schema";
import { EmailCaptureForm } from "../../email-capture-form";
import { FaqAccordion } from "../../faq-accordion";
import { FeatureIcon } from "../../landing/feature-icon";
import { SectionShell } from "../../landing/primitives";
import { SiteFooter } from "../../landing/site-footer";
import { TrackedLink } from "../../tracked-link";
import { ViewportEvent } from "../../viewport-event";
import { Badge } from "../../ui/badge";
import { buttonClassName } from "../../ui/button";
import { Card } from "../../ui/card";
import { Chip } from "../../ui/chip";
import { TestimonialSlider } from "./testimonial-slider";

export function StepperBlockView({ block }: { block: StepperBlock }) {
  return (
    <SectionShell
      id={block.id}
      title={block.content.title}
      kicker={block.content.kicker ?? "How it works"}
      theme={block.theme ?? "emerald"}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {block.content.steps.map((step, index) => (
          <Card key={`${step.title}-${index}`} className="group relative overflow-hidden p-5">
            <ViewportEvent
              eventName="how_it_works_step_view"
              eventProps={{ step_index: index }}
              once={false}
            />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-gold/50 to-transparent" />
            <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-sm font-semibold text-gold">
              {index + 1}
            </div>
            <h3 className="text-lg font-semibold text-parchment">{step.title}</h3>
            <p className="mt-2 text-sm leading-7 text-white/70">{step.desc}</p>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}

export function FeatureGridBlockView({ block }: { block: FeatureGridBlock }) {
  return (
    <SectionShell
      id={block.id}
      title={block.content.title}
      kicker={block.content.kicker ?? "Features"}
      theme={block.theme ?? "navy"}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {block.content.items.map((item, index) => (
          <Card
            key={`${item.title}-${index}`}
            className="p-5 backdrop-blur-md transition hover:-translate-y-1 hover:border-gold/35"
          >
            {item.icon ? (
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                <FeatureIcon name={item.icon} />
              </div>
            ) : null}
            <h3 className="text-base font-semibold text-parchment">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-white/70">{item.desc}</p>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}

export function HighlightBannerBlockView({
  block
}: {
  block: HighlightBannerBlock;
}) {
  const cta = block.content.cta;

  return (
    <section id={block.id} className="mx-auto w-full max-w-7xl px-6 py-5 sm:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-[radial-gradient(circle_at_15%_20%,rgba(17,59,52,0.52),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(213,179,106,0.14),transparent_40%),radial-gradient(circle_at_70%_100%,rgba(198,109,99,0.14),transparent_45%),linear-gradient(135deg,rgba(15,30,53,0.92),rgba(10,19,33,0.96))] p-6 shadow-panel sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute right-[-18%] top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-gold/25 bg-gold/5 blur-2xl" />
        <div className="absolute left-8 top-0 h-px w-36 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        {block.content.badge ? <Badge>{block.content.badge}</Badge> : null}
        <div className="relative mt-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl leading-tight text-parchment sm:text-4xl">
              {block.content.title}
            </h2>
            {block.content.desc ? (
              <p className="mt-3 text-sm leading-7 text-white/80 sm:text-base">
                {block.content.desc}
              </p>
            ) : null}
          </div>
          {cta ? (
            <TrackedLink
              href={cta.href}
              eventName={cta.eventName}
              eventProps={cta.eventProps}
              className={buttonClassName({
                variant: cta.variant ?? "primary",
                size: "lg"
              })}
            >
              {cta.label}
            </TrackedLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CarouselCardsBlockView({ block }: { block: CarouselBlock }) {
  return (
    <SectionShell
      id={block.id}
      title={block.content.title}
      kicker={block.content.kicker ?? "Templates"}
      theme={block.theme ?? "rose"}
    >
      {block.content.desc ? (
        <p className="mb-5 max-w-3xl text-sm leading-7 text-white/70">
          {block.content.desc}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {block.content.items.map((item, index) => (
          <Card key={`${item.name}-${index}`} className="group relative overflow-hidden p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Template</p>
            <h3 className="mt-2 text-xl font-semibold text-parchment">{item.name}</h3>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-white/70">
              {typeof item.chapters === "number" ? <Chip>{item.chapters} chapters</Chip> : null}
              {typeof item.minutesToStart === "number" ? (
                <Chip>{item.minutesToStart} min start</Chip>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
      {block.content.cta ? (
        <div className="mt-6">
          <TrackedLink
            href={block.content.cta.href}
            eventName={block.content.cta.eventName}
            eventProps={block.content.cta.eventProps}
            className={buttonClassName({
              variant: block.content.cta.variant ?? "secondary",
              size: "md"
            })}
          >
            {block.content.cta.label}
          </TrackedLink>
        </div>
      ) : null}
    </SectionShell>
  );
}

export function TestimonialsBlockView({
  block
}: {
  block: TestimonialsBlock;
}) {
  return (
    <SectionShell
      id={block.id}
      title={block.content.title}
      kicker={block.content.kicker ?? "Testimonials"}
      theme={block.theme ?? "pearl"}
    >
      <TestimonialSlider block={block} />
    </SectionShell>
  );
}

export function PricingCardsBlockView({
  block
}: {
  block: PricingCardsBlock;
}) {
  return (
    <SectionShell
      id={block.id}
      title={block.content.title}
      kicker={block.content.kicker ?? "Pricing"}
      theme={block.theme ?? "gold"}
    >
      {block.content.subtitle ? (
        <p className="mb-5 max-w-3xl text-sm leading-7 text-white/70">
          {block.content.subtitle}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {block.content.plans.map((plan, index) => (
          <Card
            key={plan.id}
            className={`relative overflow-hidden p-6 ${
              plan.comingSoon
                ? "opacity-75"
                : plan.badge || index === 1
                  ? "border-gold/40 bg-gradient-to-b from-gold/10 to-white/[0.02] shadow-glow"
                  : ""
            }`}
          >
            {plan.comingSoon ? (
              <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                Coming soon
              </span>
            ) : plan.badge ? (
              <span className="absolute right-4 top-4 rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-gold">
                {plan.badge}
              </span>
            ) : null}
            <h3 className="text-xl font-semibold text-parchment">{plan.name}</h3>
            <div className="mt-3 flex items-end gap-2">
              <p className="font-display text-4xl leading-none text-parchment">{plan.price}</p>
              {plan.period ? <p className="pb-1 text-sm text-white/55">{plan.period}</p> : null}
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
              href={plan.cta.href}
              eventName={plan.cta.eventName}
              eventProps={plan.cta.eventProps}
              className={buttonClassName({
                variant: plan.cta.variant ?? (index !== 2 ? "primary" : "secondary"),
                size: "md",
                className: "mt-6 w-full"
              })}
            >
              {plan.cta.label}
            </TrackedLink>
          </Card>
        ))}
      </div>
      {block.content.note ? (
        <p className="mt-4 text-sm text-white/55">{block.content.note}</p>
      ) : null}
    </SectionShell>
  );
}

export function FaqBlockView({ block }: { block: FaqBlock }) {
  return (
    <SectionShell
      id={block.id}
      title={block.content.title}
      kicker={block.content.kicker ?? "FAQ"}
      theme={block.theme ?? "midnight"}
    >
      <FaqAccordion items={[...block.content.items]} />
    </SectionShell>
  );
}

export function EmailCaptureBlockView({
  block
}: {
  block: EmailCaptureBlock;
}) {
  return (
    <section id={block.id} className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_12%_15%,rgba(213,179,106,0.12),transparent_44%),radial-gradient(circle_at_90%_25%,rgba(198,109,99,0.13),transparent_40%),radial-gradient(circle_at_80%_100%,rgba(17,59,52,0.2),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-6 shadow-panel sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            {block.content.badge ? <Badge className="mb-4">{block.content.badge}</Badge> : null}
            <h2 className="font-display text-3xl leading-tight text-parchment sm:text-4xl">
              {block.content.title}
            </h2>
            {block.content.desc ? (
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                {block.content.desc}
              </p>
            ) : null}
          </div>
          <div className="relative rounded-2xl border border-white/10 bg-black/10 p-4 backdrop-blur-sm">
            <EmailCaptureForm />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FooterBlockView({ block }: { block: FooterBlock }) {
  return (
    <div id={block.id}>
      <SiteFooter />
    </div>
  );
}
