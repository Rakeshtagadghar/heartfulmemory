import type { TechStackCategory, TechStackItem } from "../types/techStack";

export const TECH_STACK_CATEGORIES: TechStackCategory[] = [
  "Frontend",
  "Backend",
  "AI",
  "Storage & Media",
  "Observability",
  "Payments",
  "Email",
  "Integrations",
  "Hosting",
  "Testing"
];

export const techStackItems: TechStackItem[] = [
  // ── Frontend ────────────────────────────────────────────────────────────────
  {
    id: "nextjs",
    name: "Next.js",
    iconKey: "nextjs",
    category: "Frontend",
    websiteUrl: "https://nextjs.org",
    docsUrl: "https://nextjs.org/docs",
    role: "Full-stack React framework (App Router)",
    why: "App Router gives us server components, layouts, and file-based routing out of the box.",
    usedIn: ["All pages", "API routes", "Metadata"],
    status: "core"
  },
  {
    id: "react",
    name: "React",
    iconKey: "react",
    category: "Frontend",
    websiteUrl: "https://react.dev",
    docsUrl: "https://react.dev/reference",
    role: "UI component library",
    why: "The most mature ecosystem for building interactive UIs with server + client component support.",
    usedIn: ["All UI components"],
    status: "core"
  },
  {
    id: "typescript",
    name: "TypeScript",
    iconKey: "typescript",
    category: "Frontend",
    websiteUrl: "https://www.typescriptlang.org",
    docsUrl: "https://www.typescriptlang.org/docs",
    role: "Type-safe JavaScript across frontend and backend",
    why: "Catches bugs at compile time and makes refactoring across large codebases safe.",
    usedIn: ["All source files"],
    status: "core"
  },
  {
    id: "tailwindcss",
    name: "Tailwind CSS",
    iconKey: "tailwindcss",
    category: "Frontend",
    websiteUrl: "https://tailwindcss.com",
    docsUrl: "https://tailwindcss.com/docs",
    role: "Utility-first styling framework",
    why: "Enables rapid UI iteration with consistent design tokens without leaving the markup.",
    usedIn: ["All components", "Layout", "Landing pages"],
    status: "core"
  },
  // ── Backend ──────────────────────────────────────────────────────────────────
  {
    id: "convex",
    name: "Convex",
    iconKey: "convex",
    category: "Backend",
    websiteUrl: "https://convex.dev",
    docsUrl: "https://docs.convex.dev",
    role: "Reactive backend: database, queries, mutations, and actions",
    why: "Real-time reactivity, TypeScript-native schema, and serverless functions in one platform.",
    usedIn: ["Storybooks", "Chapters", "Photos", "User data", "AI actions"],
    status: "core"
  },
  {
    id: "nextauth",
    name: "NextAuth.js",
    iconKey: "nextauth",
    category: "Backend",
    websiteUrl: "https://next-auth.js.org",
    docsUrl: "https://next-auth.js.org/getting-started/introduction",
    role: "Authentication (sessions, OAuth providers)",
    why: "Battle-tested auth for Next.js with minimal configuration and provider flexibility.",
    usedIn: ["Login", "Session management", "Protected routes"],
    status: "core"
  },
  // ── AI ───────────────────────────────────────────────────────────────────────
  {
    id: "groq",
    name: "Groq",
    iconKey: "groq",
    category: "AI",
    websiteUrl: "https://groq.com",
    docsUrl: "https://console.groq.com/docs",
    role: "Ultra-fast speech-to-text transcription",
    why: "Best-in-class inference speed for Whisper-compatible STT with competitive accuracy.",
    usedIn: ["Voice recording transcription"],
    status: "core"
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    iconKey: "elevenlabs",
    category: "AI",
    websiteUrl: "https://elevenlabs.io",
    docsUrl: "https://elevenlabs.io/docs",
    role: "AI narration and text-to-speech",
    why: "Natural-sounding voice narration to bring storybook chapters to life.",
    usedIn: ["AI narration panel", "Chapter audio"],
    status: "core"
  },
  // ── Storage & Media ──────────────────────────────────────────────────────────
  {
    id: "cloudflare-r2",
    name: "Cloudflare R2",
    iconKey: "cloudflare",
    category: "Storage & Media",
    websiteUrl: "https://www.cloudflare.com/products/r2",
    docsUrl: "https://developers.cloudflare.com/r2",
    role: "Object storage for photos, audio, and exports",
    why: "Zero egress fees and S3-compatible API make it ideal for user-generated media at scale.",
    usedIn: ["Photo uploads", "Audio files", "PDF exports"],
    status: "core"
  },
  // ── Observability ────────────────────────────────────────────────────────────
  {
    id: "sentry",
    name: "Sentry",
    iconKey: "sentry",
    category: "Observability",
    websiteUrl: "https://sentry.io",
    docsUrl: "https://docs.sentry.io/platforms/javascript/guides/nextjs",
    role: "Error monitoring and performance tracing",
    why: "Catches exceptions in production with full stack traces and release tracking.",
    usedIn: ["Frontend errors", "API errors", "Performance traces"],
    status: "core"
  },
  // ── Payments ─────────────────────────────────────────────────────────────────
  {
    id: "stripe",
    name: "Stripe",
    iconKey: "stripe",
    category: "Payments",
    websiteUrl: "https://stripe.com",
    docsUrl: "https://stripe.com/docs",
    role: "Subscription billing and payment processing",
    why: "Best-in-class developer experience for subscriptions, webhooks, and the billing portal.",
    usedIn: ["Pro Export subscription", "Billing portal", "Invoices"],
    status: "core"
  },
  // ── Email ────────────────────────────────────────────────────────────────────
  {
    id: "resend",
    name: "Resend",
    iconKey: "resend",
    category: "Email",
    websiteUrl: "https://resend.com",
    docsUrl: "https://resend.com/docs",
    role: "Transactional email delivery",
    why: "Modern API-first email with React Email templates and excellent deliverability.",
    usedIn: ["Transactional emails", "Waitlist notifications"],
    status: "core"
  },
  // ── Integrations ─────────────────────────────────────────────────────────────
  {
    id: "unsplash",
    name: "Unsplash",
    iconKey: "unsplash",
    category: "Integrations",
    websiteUrl: "https://unsplash.com",
    docsUrl: "https://unsplash.com/documentation",
    role: "Free high-quality stock photography",
    why: "Huge library of CC0-licensed photos to enrich chapters without copyright concerns.",
    usedIn: ["Stock photo search", "Chapter illustrations"],
    status: "core"
  },
  {
    id: "pexels",
    name: "Pexels",
    iconKey: "pexels",
    category: "Integrations",
    websiteUrl: "https://www.pexels.com",
    docsUrl: "https://www.pexels.com/api/documentation",
    role: "Additional stock photography and video",
    why: "Complements Unsplash with a separate library for broader coverage.",
    usedIn: ["Stock photo search", "Chapter illustrations"],
    status: "core"
  },
  // ── Hosting ──────────────────────────────────────────────────────────────────
  {
    id: "vercel",
    name: "Vercel",
    iconKey: "vercel",
    category: "Hosting",
    websiteUrl: "https://vercel.com",
    docsUrl: "https://vercel.com/docs",
    role: "Deployment and edge hosting for the Next.js app",
    why: "First-class Next.js support with zero-config deployments, preview URLs, and global CDN.",
    usedIn: ["Production hosting", "Preview deployments"],
    status: "core"
  },
  // ── Testing ──────────────────────────────────────────────────────────────────
  {
    id: "vitest",
    name: "Vitest",
    iconKey: "vitest",
    category: "Testing",
    websiteUrl: "https://vitest.dev",
    docsUrl: "https://vitest.dev/guide",
    role: "Unit and integration testing",
    why: "Vite-native test runner with near-zero config and Jest-compatible API.",
    usedIn: ["Unit tests", "Integration tests"],
    status: "core"
  },
  {
    id: "playwright",
    name: "Playwright",
    iconKey: "playwright",
    category: "Testing",
    websiteUrl: "https://playwright.dev",
    docsUrl: "https://playwright.dev/docs/intro",
    role: "End-to-end browser testing",
    why: "Cross-browser E2E tests with auto-wait and first-class TypeScript support.",
    usedIn: ["E2E tests"],
    status: "core"
  }
];

/** Icons shown in the landing page 'Built With' strip (6 max) */
export const BUILT_WITH_STRIP_IDS = [
  "nextjs",
  "typescript",
  "convex",
  "cloudflare-r2",
  "stripe",
  "sentry"
];
