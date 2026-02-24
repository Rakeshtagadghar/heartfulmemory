import brandJson from "../../../docs/brand.json";

export type HowItWorksStep = { title: string; desc: string };
export type FeatureItem = { icon: string; title: string; desc: string };
export type TemplateItem = { name: string; chapters: number; minutesToStart: number };
export type TestimonialItem = { quote: string; name: string; role: string };
export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
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
    "Record or write stories. Get guided prompts. Edit chapters. Export a beautiful PDF in minutes.",
  socialProof:
    "Inspired by modern memoir services that preserve stories with prompts, recordings, and keepsake books."
} as const;

export const heroBullets = [
  "Record voice/video or type stories",
  "AI-guided interview prompts",
  "Chapters + photos, beautifully arranged",
  "Export a premium PDF storybook (Phase 1)"
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
    id: "digital",
    name: "Digital Storybook",
    price: "GBP 19",
    period: "one-time",
    features: ["Unlimited chapters", "Record or type stories", "Template library", "Photo uploads", "PDF export"],
    cta: "Get Digital",
    href: "/checkout?plan=digital"
  },
  {
    id: "gift",
    name: "Gift a Storybook",
    price: "GBP 29",
    period: "one-time",
    features: ["Everything in Digital", "Gift email + printable card", "Invite storyteller flow", "Private family contributions"],
    cta: "Gift it",
    href: "/checkout?plan=gift"
  },
  {
    id: "print_future",
    name: "Print Upgrade",
    price: "Coming soon",
    period: "",
    features: ["Hardcover print-ready layout", "QR codes to recordings", "Multiple copies"],
    cta: "Notify me",
    href: "#email_capture"
  }
];

export const faqs: readonly FaqItem[] = [
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
