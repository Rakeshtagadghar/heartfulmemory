import type { MarketingPageConfig } from "./landing.schema";
import { brand, templates } from "./landingContent";

export const templatesPageConfig: MarketingPageConfig = {
  meta: {
    title: `Story Templates | ${brand.name}`,
    description: "Browse guided storybook templates for childhood, family, milestones, and life lessons."
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Pricing", href: "/pricing" },
    { label: "Gift", href: "/gift" }
  ],
  blocks: [
    {
      type: "hero_split",
      id: "hero",
      content: {
        badge: "Templates",
        headline: "Start with a guided story path, then make it your own.",
        subheadline:
          "Pick a template for childhood roots, family life, milestones, or lessons. Reorder chapters and personalize everything.",
        visual: {
          type: "media_mock",
          items: [
            {
              src: "/marketing/book-cover.svg",
              alt: "Storybook cover template placeholder",
              width: 1200,
              height: 900,
              title: "Template Preview"
            },
            {
              src: "/marketing/family-poster.svg",
              alt: "Family poster template concept",
              width: 900,
              height: 1200,
              title: "Family Poster",
              rotate: "-4deg"
            },
            {
              src: "/marketing/chapter-page.svg",
              alt: "Chapter template preview",
              width: 1200,
              height: 900,
              title: "Chapter Prompt"
            }
          ]
        },
        ctas: [
          { label: "Start your Storybook", href: "/app/start", eventName: "cta_start_click", eventProps: { section: "hero" } },
          { label: "Gift a Storybook", href: "/gift", eventName: "cta_gift_click", eventProps: { section: "hero" }, variant: "secondary" }
        ]
      }
    },
    {
      type: "carousel_cards",
      id: "templates",
      theme: "rose",
      content: {
        kicker: "Template gallery",
        title: "Popular story templates",
        desc: "Use these as a starting structure and customize the chapter order, wording, and photos.",
        items: templates
      }
    },
    {
      type: "highlight_banner",
      id: "cta",
      content: {
        badge: "Start now",
        title: "Pick a template and begin in under 3 minutes",
        cta: { label: "Start your Storybook", href: "/app/start", eventName: "cta_start_click", eventProps: { section: "templates_banner" } }
      }
    },
    { type: "footer", id: "footer" }
  ]
};
