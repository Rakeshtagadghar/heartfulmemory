import type { MetadataRoute } from "next";
import { getSiteUrl } from "../lib/seo/constants";
import { PUBLIC_ROUTES } from "../lib/seo/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
