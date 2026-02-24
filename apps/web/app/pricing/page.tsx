import type { Metadata } from "next";
import { MarketingLayout } from "../../components/marketing/MarketingLayout";
import { MarketingPageRenderer } from "../../components/marketing/PageRenderer";
import { pricingPageConfig } from "../../content/pricingContent";

export const metadata: Metadata = {
  title: pricingPageConfig.meta.title,
  description: pricingPageConfig.meta.description,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: pricingPageConfig.meta.ogTitle ?? pricingPageConfig.meta.title,
    description: pricingPageConfig.meta.ogDescription ?? pricingPageConfig.meta.description,
    type: "website",
    url: "/pricing",
    images: ["/opengraph-image"]
  },
  twitter: {
    card: "summary_large_image",
    title: pricingPageConfig.meta.ogTitle ?? pricingPageConfig.meta.title,
    description: pricingPageConfig.meta.ogDescription ?? pricingPageConfig.meta.description,
    images: ["/twitter-image"]
  }
};

export default function PricingPage() {
  return (
    <MarketingLayout navLinks={pricingPageConfig.nav ?? []}>
      <MarketingPageRenderer blocks={pricingPageConfig.blocks} />
    </MarketingLayout>
  );
}
