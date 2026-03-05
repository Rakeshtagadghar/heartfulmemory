import { NextResponse } from "next/server";
import { getSiteUrl, SEO_SITE_NAME } from "../../lib/seo/constants";
import { PUBLIC_ROUTES } from "../../lib/seo/routes";

export function GET() {
  const siteUrl = getSiteUrl();

  const lines = [
    `# ${SEO_SITE_NAME}`,
    "",
    "> Memorioso helps families record, write, and preserve stories as beautiful keepsake storybooks.",
    "> Record voice or type stories, get guided prompts, add photos, and export a premium PDF.",
    "",
    "## Pages",
    "",
    ...PUBLIC_ROUTES.map(
      (route) => `- [${route.title}](${siteUrl}${route.path}): ${route.description}`
    ),
    ""
  ];

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
