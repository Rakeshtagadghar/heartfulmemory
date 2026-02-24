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
    <main className="relative min-h-screen overflow-x-clip bg-ink text-white">
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
