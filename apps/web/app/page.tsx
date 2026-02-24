import { StructuredData } from "../components/seo/structured-data";
import { ViewportEvent } from "../components/viewport-event";
import { FeatureGridSection } from "../components/landing/feature-grid-section";
import { FaqSection } from "../components/landing/faq-section";
import { HeroSection } from "../components/landing/hero-section";
import { HowItWorksSection } from "../components/landing/how-it-works-section";
import { PricingSection } from "../components/landing/pricing-section";
import { BackgroundOrbs } from "../components/landing/primitives";
import { RoadmapBanner } from "../components/landing/roadmap-banner";
import { SiteFooter } from "../components/landing/site-footer";
import { SiteHeader } from "../components/landing/site-header";
import { TemplatesSection } from "../components/landing/templates-section";
import { TestimonialsSection } from "../components/landing/testimonials-section";
import { WaitlistSection } from "../components/landing/waitlist-section";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_15%_10%,rgba(213,179,106,0.08),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(17,59,52,0.16),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(198,109,99,0.1),transparent_45%),linear-gradient(180deg,#0a1321_0%,#0b1423_40%,#09111d_100%)] text-white">
      <StructuredData />
      <ViewportEvent eventName="lp_view" />
      <BackgroundOrbs />
      <SiteHeader />
      <HeroSection />
      <HowItWorksSection />
      <FeatureGridSection />
      <RoadmapBanner />
      <TemplatesSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <WaitlistSection />
      <SiteFooter />
    </main>
  );
}
