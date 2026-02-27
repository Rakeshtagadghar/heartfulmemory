import type { MarketingPageConfig } from "./landing.schema";
import { brand, faqs, pricingPlans } from "./landingContent";

export const pricingPageConfig: MarketingPageConfig = {
  meta: {
    title: `Pricing | ${brand.name}`,
    description: "Compare Memorioso plans and choose the best way to preserve family stories."
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Gift", href: "/gift" },
    { label: "Templates", href: "/templates" },
    { label: "FAQ", href: "#faq" }
  ],
  blocks: [
    {
      type: "hero_split",
      id: "hero",
      content: {
        badge: "Pricing",
        headline: "Start free, then unlock Pro export at GBP 30/month.",
        subheadline:
          "Use Free to write and design your storybook. Upgrade when you are ready to export PDFs.",
        visual: {
          type: "media_mock",
          items: [
            {
              src: "/marketing/book-cover.svg",
              alt: "Memorioso storybook cover mock",
              width: 1200,
              height: 900,
              title: "Digital Storybook"
            },
            {
              src: "/marketing/chapter-page.svg",
              alt: "Chapter page placeholder with future QR area",
              width: 1200,
              height: 900,
              title: "Chapter Layout"
            },
            {
              src: "/marketing/family-poster.svg",
              alt: "Family poster placeholder concept",
              width: 900,
              height: 1200,
              title: "Poster Add-on",
              rotate: "-4deg"
            }
          ]
        },
        ctas: [
          {
            label: "Start free",
            href: "/create/template",
            eventName: "pricing_plan_select",
            eventProps: { plan_id: "free", section: "hero" }
          },
          {
            label: "Upgrade to export",
            href: "/app/account/billing?intent=upgrade",
            eventName: "cta_upgrade_click",
            eventProps: { section: "hero" },
            variant: "secondary"
          }
        ]
      }
    },
    {
      type: "pricing_cards",
      id: "pricing",
      theme: "gold",
      content: {
        kicker: "Simple plans",
        title: "Pricing",
        subtitle: "Pro export includes 100 PDF exports/month.",
        plans: pricingPlans.map((plan, index) => ({
          ...plan,
          cta: {
            label: plan.cta,
            href: plan.href,
            eventName: "pricing_plan_select",
            eventProps: { plan_id: plan.id }
          },
          badge: index === 1 ? "Most popular" : undefined
        })),
        note: "Free supports creation. Pro unlocks digital and hardcopy-ready PDF export with monthly quota."
      }
    },
    {
      type: "faq",
      id: "faq",
      theme: "midnight",
      content: {
        kicker: "Questions before purchase",
        title: "Pricing FAQ",
        items: faqs
      }
    },
    { type: "footer", id: "footer" }
  ]
};
