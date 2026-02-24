import { faqs, pricingPlans } from "../../content/landingContent";

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function StructuredData() {
  const siteUrl = getSiteUrl();
  const digitalPlan = pricingPlans.find((plan) => plan.id === "digital");

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Memorioso Digital Storybook",
    brand: {
      "@type": "Brand",
      name: "Memorioso"
    },
    description:
      "Record or write family stories, organize chapters with photos, and export a premium PDF keepsake.",
    category: "Family Storytelling Software",
    url: siteUrl,
    offers: digitalPlan
      ? {
          "@type": "Offer",
          priceCurrency: "GBP",
          price: "19",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}${digitalPlan.href}`
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}

