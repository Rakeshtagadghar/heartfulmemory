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
        headline: "Choose the right way to preserve your family stories.",
        subheadline:
          "Start digital now, gift a storyteller, and upgrade to print when your keepsake is ready.",
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
          { label: "Get Digital", href: "/checkout?plan=digital", eventName: "pricing_plan_select", eventProps: { plan_id: "digital", section: "hero" } },
          { label: "Gift a Storybook", href: "/gift", eventName: "cta_gift_click", eventProps: { section: "hero" }, variant: "secondary" }
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
        subtitle: "Digital first. Print upgrade later.",
        plans: pricingPlans.map((plan, index) => ({
          ...plan,
          cta: {
            label: plan.cta,
            href: plan.href,
            eventName: "pricing_plan_select",
            eventProps: { plan_id: plan.id }
          },
          badge: index === 1 ? "Popular gift" : undefined
        })),
        note: "Phase 1 supports digital exports. Hardcover print upgrade is marked as coming soon."
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
