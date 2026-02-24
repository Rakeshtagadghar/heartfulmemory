import type { Metadata } from "next";
import { MarketingLayout } from "../../components/marketing/MarketingLayout";
import { MarketingPageRenderer } from "../../components/marketing/PageRenderer";
import { giftPageConfig } from "../../content/giftContent";

export const metadata: Metadata = {
  title: giftPageConfig.meta.title,
  description: giftPageConfig.meta.description,
  alternates: { canonical: "/gift" },
  openGraph: {
    title: giftPageConfig.meta.ogTitle ?? giftPageConfig.meta.title,
    description: giftPageConfig.meta.ogDescription ?? giftPageConfig.meta.description,
    type: "website",
    url: "/gift",
    images: ["/opengraph-image"]
  },
  twitter: {
    card: "summary_large_image",
    title: giftPageConfig.meta.ogTitle ?? giftPageConfig.meta.title,
    description: giftPageConfig.meta.ogDescription ?? giftPageConfig.meta.description,
    images: ["/twitter-image"]
  }
};

export default function GiftPage() {
  return (
    <MarketingLayout navLinks={giftPageConfig.nav ?? []}>
      <MarketingPageRenderer blocks={giftPageConfig.blocks} />
    </MarketingLayout>
  );
}
