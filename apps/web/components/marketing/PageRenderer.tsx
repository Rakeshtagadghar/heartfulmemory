import type { MarketingBlock } from "../../content/landing.schema";
import { HeroSplit } from "./blocks/hero-split";
import {
  CarouselCardsBlockView,
  EmailCaptureBlockView,
  FaqBlockView,
  FeatureGridBlockView,
  FooterBlockView,
  HighlightBannerBlockView,
  PricingCardsBlockView,
  StepperBlockView,
  TestimonialsBlockView
} from "./blocks/page-blocks";

export function MarketingPageRenderer({ blocks }: { blocks: readonly MarketingBlock[] }) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case "hero_split":
            return <HeroSplit key={block.id} block={block} />;
          case "stepper":
            return <StepperBlockView key={block.id} block={block} />;
          case "feature_grid":
            return <FeatureGridBlockView key={block.id} block={block} />;
          case "highlight_banner":
            return <HighlightBannerBlockView key={block.id} block={block} />;
          case "carousel_cards":
            return <CarouselCardsBlockView key={block.id} block={block} />;
          case "testimonials":
            return <TestimonialsBlockView key={block.id} block={block} />;
          case "pricing_cards":
            return <PricingCardsBlockView key={block.id} block={block} />;
          case "faq":
            return <FaqBlockView key={block.id} block={block} />;
          case "email_capture":
            return <EmailCaptureBlockView key={block.id} block={block} />;
          case "footer":
            return <FooterBlockView key={block.id} block={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}
