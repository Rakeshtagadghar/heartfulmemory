import brandJson from "../../../docs/brand.json";
import type { MarketingPageConfig } from "./landing.schema";

export type HowItWorksStep = { title: string; desc: string };
export type FeatureItem = { icon: string; title: string; desc: string };
export type TemplateItem = { name: string; chapters: number; minutesToStart: number };
export type TestimonialItem = { quote: string; name: string; role: string };
export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period?: string;
  features: string[];
  cta: string;
  href: string;
  comingSoon?: boolean;
};
export type FaqItem = { q: string; a: string };

export const brand = brandJson;

export const landingSeo = {
  title: `Create a Family Storybook | ${brand.name}`,
  description:
    "Record or write stories, get guided prompts, add photos, and export a beautiful PDF storybook.",
  ogTitle: `${brand.name} | ${brand.tagline}`,
  ogDescription:
    "Capture memories in voice or text. Export a premium PDF keepsake.",
  twitterTitle: `${brand.name} | Family Storybooks`,
  twitterDescription:
    "Capture stories in voice or text and export a premium PDF keepsake."
} as const;

export const heroCopy = {
  badge: brand.name,
  headline: "Turn family memories into a royal heirloom storybook.",
  subheadline:
    "Record or write stories. Get guided prompts. Edit chapters. Start free, then upgrade to Pro export when ready.",
  socialProof:
    "Inspired by modern memoir services that preserve stories with prompts, recordings, and keepsake books."
} as const;

export const heroBullets = [
  "Record voice/video or type stories",
  "AI-guided interview prompts",
  "Chapters + photos, beautifully arranged",
  "Pro export: up to 100 PDFs/month + hardcopy-ready mode"
] as const;

export const howItWorks: readonly HowItWorksStep[] = [
  {
    title: "Choose your storyteller",
    desc: "Start for yourself or invite a parent or grandparent to contribute."
  },
  {
    title: "Write or record stories",
    desc: "Type, upload audio or video, or answer guided prompts."
  },
  {
    title: "Shape chapters beautifully",
    desc: "Edit, reorder chapters, and add photos with captions."
  },
  {
    title: "Export your keepsake",
    desc: "Download a premium PDF storybook and share privately."
  }
];

export const features: readonly FeatureItem[] = [
  { icon: "mic", title: "Record or type", desc: "Capture stories in the way that feels natural." },
  { icon: "sparkles", title: "AI Interview Prompts", desc: "Smart follow-ups help uncover deeper details." },
  { icon: "file", title: "Transcription-ready pipeline", desc: "Turn recordings into editable text." },
  { icon: "image", title: "Unlimited photos", desc: "Add photos with captions to enrich every chapter." },
  { icon: "lock", title: "Private sharing", desc: "Invite family to contribute with controlled access." },
  { icon: "download", title: "Export PDF", desc: "A keepsake storybook you can download and print." }
];

export const templates: readonly TemplateItem[] = [
  { name: "Childhood & Roots", chapters: 10, minutesToStart: 3 },
  { name: "Love & Family", chapters: 8, minutesToStart: 3 },
  { name: "Career & Lessons", chapters: 8, minutesToStart: 3 },
  { name: "Life Milestones", chapters: 12, minutesToStart: 3 }
];

export const testimonials: readonly TestimonialItem[] = [
  {
    quote: "We finally captured stories we had never heard before, beautifully put together.",
    name: "Customer",
    role: "Gift buyer"
  },
  {
    quote: "The prompts made it easy to start. Editing the chapters felt surprisingly fun.",
    name: "Customer",
    role: "Storyteller"
  }
];

export const pricingPlans: readonly PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "GBP 0",
    period: "per month",
    features: [
      "Create and edit storybooks",
      "Guided prompts and chapter drafting",
      "Photo uploads and studio layout tools"
    ],
    cta: "Start free",
    href: "/create/template"
  },
  {
    id: "pro",
    name: "Pro Export",
    price: "GBP 30",
    period: "per month",
    features: [
      "Up to 100 PDF exports/month",
      "Digital and hardcopy-ready PDF export",
      "Manage billing and invoices in Stripe portal"
    ],
    cta: "Upgrade to export",
    href: "/app/account/billing?intent=upgrade"
  },
  {
    id: "hardcopy",
    name: "Hardcopy Book",
    price: "TBD",
    features: [
      "Printed hardcover storybook delivered",
      "Premium paper and binding",
      "Perfect as a gift or keepsake"
    ],
    cta: "Coming soon",
    href: "#email_capture",
    comingSoon: true
  }
];

export const faqs: readonly FaqItem[] = [
  {
    q: "Why do I need Pro to export?",
    a: "PDF export is part of Pro. The Free plan is for writing, editing, and preparing your storybook before export."
  },
  {
    q: "Do I have to write?",
    a: "No. You can record voice or video and turn it into an editable story. Phase 1 includes recording and a transcription-ready pipeline."
  },
  {
    q: "Can my parents contribute without being tech-savvy?",
    a: "Yes. The flow is designed to be simple: tap record or type, answer prompts, and save."
  },
  {
    q: "Can I print the book?",
    a: "Phase 1 exports a premium PDF you can print. Hardcover printing is planned as an upgrade."
  },
  {
    q: "Will chapters include QR codes to recordings?",
    a: "This is on the roadmap. QR codes can link to audio or video playback per chapter."
  },
  {
    q: "How private is it?",
    a: "Your content is private by default. You control invites and sharing."
  }
];

export const landingPageConfig: MarketingPageConfig = {
  meta: {
    title: landingSeo.title,
    description: landingSeo.description,
    ogTitle: landingSeo.ogTitle,
    ogDescription: landingSeo.ogDescription
  },
  nav: brand.navLabels.map((item) => ({ label: item.label, href: `#${item.id}` })),
  blocks: [
    {
      type: "hero_split",
      id: "hero",
      content: {
        badge: heroCopy.badge,
        headline: heroCopy.headline,
        subheadline: heroCopy.subheadline,
        bullets: heroBullets,
        socialProof: heroCopy.socialProof,
        ctas: [
          {
            label: "Start free",
            href: "/create/template",
            eventName: "cta_start_click",
            eventProps: { section: "hero" },
            variant: "primary"
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
      type: "stepper",
      id: "how_it_works",
      theme: "emerald",
      content: {
        kicker: "Simple in four steps",
        title: "How it works",
        steps: howItWorks
      }
    },
    {
      type: "feature_grid",
      id: "feature_grid",
      theme: "navy",
      content: {
        kicker: "Built for memory capture, not busywork",
        title: "Everything you need to start (Phase 1)",
        items: features
      }
    },
    {
      type: "highlight_banner",
      id: "qr_teaser",
      content: {
        badge: "Roadmap",
        title: "Scan-to-relive (coming next)",
        desc: "Future chapters can include QR codes so readers can hear the original voice behind each story.",
        cta: {
          label: "Join the waitlist",
          href: "#email_capture",
          eventName: "email_capture_focus",
          variant: "primary"
        }
      }
    },
    {
      type: "carousel_cards",
      id: "templates",
      theme: "rose",
      content: {
        kicker: "Choose a guided path, then personalize it",
        title: "Start faster with story templates",
        items: templates,
        cta: {
          label: "Browse templates",
          href: "/templates",
          eventName: "cta_templates_click",
          variant: "secondary"
        }
      }
    },
    {
      type: "testimonials",
      id: "testimonials",
      theme: "pearl",
      content: {
        kicker: "Placeholder reviews for Phase 1",
        title: "Made for families, easy for elders",
        items: testimonials
      }
    },
    {
      type: "pricing_cards",
      id: "pricing",
      theme: "gold",
      content: {
        kicker: "Start digital. Upgrade to print later.",
        title: "Simple pricing",
        plans: pricingPlans.map((plan, index) => ({
          ...plan,
          cta: {
            label: plan.cta,
            href: plan.href,
            eventName: "pricing_plan_select",
            eventProps: { plan_id: plan.id },
            variant: index === 0 ? "secondary" : "primary"
          },
          badge: index === 1 ? "Most popular" : undefined
        })),
        note:
          "Pro includes up to 100 PDF exports per month and hardcopy-ready output."
      }
    },
    {
      type: "faq",
      id: "faq",
      theme: "midnight",
      content: {
        kicker: "Clear answers before you commit",
        title: "Frequently asked questions",
        items: faqs
      }
    },
    {
      type: "email_capture",
      id: "email_capture",
      content: {
        badge: "Waitlist",
        title: "Get notified when QR and print upgrades launch",
        desc: "Join early to get roadmap updates and launch pricing when hardcover and scan-to-relive chapters become available."
      }
    },
    {
      type: "built_with",
      id: "built_with"
    },
    {
      type: "footer",
      id: "footer"
    }
  ]
};
