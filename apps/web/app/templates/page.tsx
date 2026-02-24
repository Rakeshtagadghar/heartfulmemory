import type { Metadata } from "next";
import { MarketingLayout } from "../../components/marketing/MarketingLayout";
import { MarketingPageRenderer } from "../../components/marketing/PageRenderer";
import { templatesPageConfig } from "../../content/templatesContent";

export const metadata: Metadata = {
  title: templatesPageConfig.meta.title,
  description: templatesPageConfig.meta.description,
  alternates: { canonical: "/templates" },
  openGraph: {
    title: templatesPageConfig.meta.ogTitle ?? templatesPageConfig.meta.title,
    description:
      templatesPageConfig.meta.ogDescription ?? templatesPageConfig.meta.description,
    type: "website",
    url: "/templates",
    images: ["/opengraph-image"]
  },
  twitter: {
    card: "summary_large_image",
    title: templatesPageConfig.meta.ogTitle ?? templatesPageConfig.meta.title,
    description:
      templatesPageConfig.meta.ogDescription ?? templatesPageConfig.meta.description,
    images: ["/twitter-image"]
  }
};

export default function TemplatesPage() {
  return (
    <MarketingLayout navLinks={templatesPageConfig.nav ?? []}>
      <MarketingPageRenderer blocks={templatesPageConfig.blocks} />
    </MarketingLayout>
  );
}
