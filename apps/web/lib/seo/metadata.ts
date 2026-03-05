import type { Metadata } from "next";
import { SEO_SITE_NAME, SEO_OG_IMAGE_PATH, SEO_TWITTER_IMAGE_PATH } from "./constants";

type BuildMetadataOptions = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
};

/**
 * Build a complete Next.js Metadata object for a public page.
 * Includes title, description, canonical, OpenGraph, and Twitter card.
 */
export function buildMetadata({ title, description, path, ogImage }: BuildMetadataOptions): Metadata {
  const ogImg = ogImage ?? SEO_OG_IMAGE_PATH;

  return {
    title: `${title} | ${SEO_SITE_NAME}`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${SEO_SITE_NAME}`,
      description,
      type: "website",
      url: path,
      siteName: SEO_SITE_NAME,
      images: [{ url: ogImg, width: 1200, height: 630, alt: `${title} — ${SEO_SITE_NAME}` }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SEO_SITE_NAME}`,
      description,
      images: [ogImage ?? SEO_TWITTER_IMAGE_PATH]
    }
  };
}

/** Metadata for private/app routes — prevents indexing */
export const noindexMetadata: Metadata = {
  robots: { index: false, follow: false }
};
