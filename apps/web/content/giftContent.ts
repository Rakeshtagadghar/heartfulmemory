import type { MarketingPageConfig } from "./landing.schema";
import { brand } from "./landingContent";

export const giftPageConfig: MarketingPageConfig = {
  meta: {
    title: `Gift a Storybook | ${brand.name}`,
    description: "Give a meaningful gift that helps parents and grandparents preserve stories for generations."
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Pricing", href: "/pricing" },
    { label: "Templates", href: "/templates" }
  ],
  blocks: [
    {
      type: "hero_split",
      id: "hero",
      content: {
        badge: "Gift a Storybook",
        headline: "A gift that captures stories your family will keep forever.",
        subheadline:
          "Invite a parent or grandparent with a simple guided flow. They can record or type stories and you can help shape the chapters.",
        visual: {
          type: "media_mock",
          items: [
            {
              src: "/marketing/chapter-page.svg",
              alt: "Gift flow chapter page placeholder",
              width: 1200,
              height: 900,
              title: "Guided Stories"
            },
            {
              src: "/marketing/book-cover.svg",
              alt: "Storybook cover placeholder",
              width: 1200,
              height: 900,
              title: "Keepsake Cover"
            },
            {
              src: "/marketing/family-poster.svg",
              alt: "Family poster placeholder",
              width: 900,
              height: 1200,
              title: "Future Add-on",
              rotate: "-5deg"
            }
          ]
        },
        ctas: [
          { label: "Gift it", href: "/checkout?plan=gift", eventName: "pricing_plan_select", eventProps: { plan_id: "gift", section: "hero" } },
          { label: "See pricing", href: "/pricing", variant: "secondary" }
        ]
      }
    },
    {
      type: "stepper",
      id: "how_it_works",
      theme: "emerald",
      content: {
        kicker: "Gift flow",
        title: "How gifting works",
        steps: [
          { title: "Choose the gift plan", desc: "Select a giftable storybook package and personalize the invite." },
          { title: "Send the invitation", desc: "Share by email or print a gift card for a special moment." },
          { title: "They record or write", desc: "Your storyteller can answer prompts in the easiest format for them." },
          { title: "Shape and export the keepsake", desc: "Review chapters, add photos, and export the family storybook PDF." }
        ]
      }
    },
    {
      type: "highlight_banner",
      id: "cta",
      content: {
        badge: "Coming soon add-ons",
        title: "Start a meaningful gift in minutes",
        desc: "No complicated setup. Your storyteller can begin with guided prompts right away.",
        cta: { label: "Gift a Storybook", href: "/checkout?plan=gift", eventName: "pricing_plan_select", eventProps: { plan_id: "gift", section: "banner" } }
      }
    },
    { type: "footer", id: "footer" }
  ]
};
