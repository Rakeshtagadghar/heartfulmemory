export type CTAConfig = {
  label: string;
  href: string;
  eventName?: string;
  eventProps?: Record<string, string | number>;
  variant?: "primary" | "secondary" | "ghost";
};

export type HeroSplitBlock = {
  type: "hero_split";
  id: string;
  content: {
    badge?: string;
    headline: string;
    subheadline?: string;
    bullets?: readonly string[];
    ctas?: CTAConfig[];
    socialProof?: string;
    visual?: {
      type: "hero_visual" | "media_mock";
      items?: readonly {
        src: string;
        alt: string;
        width: number;
        height: number;
        title?: string;
        subtitle?: string;
        rotate?: string;
      }[];
    };
  };
};

export type StepperBlock = {
  type: "stepper";
  id: string;
  theme?: "emerald" | "navy" | "rose" | "gold" | "midnight" | "pearl";
  content: {
    kicker?: string;
    title: string;
    steps: readonly { title: string; desc: string }[];
  };
};

export type FeatureGridBlock = {
  type: "feature_grid";
  id: string;
  theme?: "emerald" | "navy" | "rose" | "gold" | "midnight" | "pearl";
  content: {
    kicker?: string;
    title: string;
    items: readonly { icon?: string; title: string; desc: string }[];
  };
};

export type HighlightBannerBlock = {
  type: "highlight_banner";
  id: string;
  content: {
    badge?: string;
    title: string;
    desc?: string;
    cta?: CTAConfig;
  };
};

export type CarouselBlock = {
  type: "carousel_cards";
  id: string;
  theme?: "emerald" | "navy" | "rose" | "gold" | "midnight" | "pearl";
  content: {
    kicker?: string;
    title: string;
    desc?: string;
    items: readonly { name: string; chapters?: number; minutesToStart?: number }[];
    cta?: CTAConfig;
  };
};

export type TestimonialsBlock = {
  type: "testimonials";
  id: string;
  theme?: "emerald" | "navy" | "rose" | "gold" | "midnight" | "pearl";
  content: {
    kicker?: string;
    title: string;
    items: readonly { quote: string; name: string; role: string }[];
  };
};

export type PricingCardsBlock = {
  type: "pricing_cards";
  id: string;
  theme?: "emerald" | "navy" | "rose" | "gold" | "midnight" | "pearl";
  content: {
    kicker?: string;
    title: string;
    subtitle?: string;
    plans: readonly {
      id: string;
      name: string;
      price: string;
      period?: string;
      features: readonly string[];
      cta: CTAConfig;
      badge?: string;
      comingSoon?: boolean;
    }[];
    note?: string;
  };
};

export type FaqBlock = {
  type: "faq";
  id: string;
  theme?: "emerald" | "navy" | "rose" | "gold" | "midnight" | "pearl";
  content: {
    kicker?: string;
    title: string;
    items: readonly { q: string; a: string }[];
  };
};

export type EmailCaptureBlock = {
  type: "email_capture";
  id: string;
  content: {
    badge?: string;
    title: string;
    desc?: string;
  };
};

export type FooterBlock = {
  type: "footer";
  id: string;
};

export type MarketingBlock =
  | HeroSplitBlock
  | StepperBlock
  | FeatureGridBlock
  | HighlightBannerBlock
  | CarouselBlock
  | TestimonialsBlock
  | PricingCardsBlock
  | FaqBlock
  | EmailCaptureBlock
  | FooterBlock;

export type MarketingPageConfig = {
  meta: {
    title: string;
    description: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  nav?: Array<{ label: string; href: string }>;
  blocks: MarketingBlock[];
};
