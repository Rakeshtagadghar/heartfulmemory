import type { MetadataRoute } from "next";
import { getSiteUrl } from "../lib/seo/constants";
import { PRIVATE_ROUTE_PREFIXES } from "../lib/seo/routes";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_ROUTE_PREFIXES]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}

