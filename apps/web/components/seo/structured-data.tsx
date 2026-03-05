import { faqs, pricingPlans } from "../../content/landingContent";
import { getSiteUrl, SEO_SITE_NAME } from "../../lib/seo/constants";

export function StructuredData() {
  const siteUrl = getSiteUrl();
  const proPlan = pricingPlans.find((plan) => plan.id === "pro");

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_SITE_NAME,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    description:
      "Memorioso helps families record, write, and preserve stories as beautiful keepsake storybooks."
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SEO_SITE_NAME,
    url: siteUrl
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Memorioso Digital Storybook",
    brand: {
      "@type": "Brand",
      name: SEO_SITE_NAME
    },
    description:
      "Record or write family stories, organize chapters with photos, and export a premium PDF keepsake.",
    category: "Family Storytelling Software",
    url: siteUrl,
    offers: proPlan
      ? {
          "@type": "Offer",
          priceCurrency: "GBP",
          price: "30",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}${proPlan.href}`
        }
      : undefined
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
