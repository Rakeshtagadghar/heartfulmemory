/** Branding constants used across SEO helpers */
export const SEO_SITE_NAME = "Memorioso";
export const SEO_DEFAULT_DESCRIPTION =
  "Record or write family stories, get guided prompts, add photos, and export a beautiful PDF storybook.";
export const SEO_OG_IMAGE_PATH = "/opengraph-image";
export const SEO_TWITTER_IMAGE_PATH = "/twitter-image";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
