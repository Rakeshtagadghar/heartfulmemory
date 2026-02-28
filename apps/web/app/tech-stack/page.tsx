import type { Metadata } from "next";
import { MarketingLayout } from "../../components/marketing/MarketingLayout";
import { SiteFooter } from "../../components/landing/site-footer";
import { TechStackGrid } from "../../components/techstack/TechStackGrid";
import { techStackItems } from "../../content/techStack";
import { brand } from "../../content/landingContent";

export const metadata: Metadata = {
  title: `Tech Stack — ${brand.name}`,
  description:
    "A transparent look at the tools and technologies powering Bloodline Storybook: Next.js, Convex, Cloudflare R2, Stripe, and more.",
  alternates: { canonical: "/tech-stack" },
  openGraph: {
    title: `Tech Stack — ${brand.name}`,
    description:
      "The full stack behind Bloodline Storybook — categorised with rationale for every tool we chose.",
    type: "website",
    url: "/tech-stack",
    images: ["/opengraph-image"]
  },
  twitter: {
    card: "summary_large_image",
    title: `Tech Stack — ${brand.name}`,
    description:
      "The full stack behind Bloodline Storybook — categorised with rationale for every tool we chose.",
    images: ["/twitter-image"]
  }
};

export default function TechStackPage() {
  return (
    <MarketingLayout navLinks={[]}>
      <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-16 sm:px-8">
        {/* Hero */}
        <header className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold/80">
            Open stack
          </p>
          <h1 className="font-display text-5xl leading-tight text-parchment sm:text-6xl">
            Built with the best tools for the job.
          </h1>
          <p className="mt-5 text-base leading-8 text-white/70 sm:text-lg">
            Every technology here was chosen deliberately. This page explains what each one does
            and why we picked it — so you can judge for yourself.
          </p>
        </header>

        <TechStackGrid items={techStackItems} />
      </div>
      <SiteFooter />
    </MarketingLayout>
  );
}
