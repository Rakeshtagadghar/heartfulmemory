/**
 * SEO Route Inventory
 *
 * Central list of public (indexable) and private (noindex) routes.
 * Used by sitemap.ts, robots.ts, and llms.txt generation.
 */

export type PublicRoute = {
  path: string;
  title: string;
  description: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
};

/** Public marketing pages — indexable, included in sitemap */
export const PUBLIC_ROUTES: readonly PublicRoute[] = [
  {
    path: "/",
    title: "Create a Family Storybook",
    description: "Record or write stories, get guided prompts, add photos, and export a beautiful PDF storybook.",
    changeFrequency: "weekly",
    priority: 1
  },
  {
    path: "/pricing",
    title: "Pricing",
    description: "Simple pricing for Memorioso storybooks. Start free, upgrade to Pro for PDF export.",
    changeFrequency: "weekly",
    priority: 0.8
  },
  {
    path: "/templates",
    title: "Story Templates",
    description: "Browse guided story templates to start your family storybook faster.",
    changeFrequency: "weekly",
    priority: 0.8
  },
  {
    path: "/gift",
    title: "Gift a Storybook",
    description: "Give a meaningful gift — a family storybook capturing memories and stories.",
    changeFrequency: "weekly",
    priority: 0.8
  },
  {
    path: "/tech-stack",
    title: "Tech Stack",
    description: "A transparent look at the tools and technologies powering Memorioso.",
    changeFrequency: "monthly",
    priority: 0.5
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description: "How Memorioso collects, uses, and protects your information.",
    changeFrequency: "monthly",
    priority: 0.3
  },
  {
    path: "/terms",
    title: "Terms of Use",
    description: "Terms for using Memorioso.",
    changeFrequency: "monthly",
    priority: 0.3
  },
  {
    path: "/contact",
    title: "Contact",
    description: "Contact Memorioso support for account, billing, and privacy requests.",
    changeFrequency: "monthly",
    priority: 0.4
  }
];

/** Private route prefixes — noindex, disallowed in robots.txt */
export const PRIVATE_ROUTE_PREFIXES = [
  "/auth/",
  "/account/",
  "/app/",
  "/book/",
  "/studio/",
  "/billing/",
  "/create/",
  "/api/"
] as const;
