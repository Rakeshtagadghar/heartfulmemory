import { MarketingLayout } from "../components/marketing/MarketingLayout";
import { MarketingPageRenderer } from "../components/marketing/PageRenderer";
import { StructuredData } from "../components/seo/StructuredData";
import { ViewportEvent } from "../components/viewport-event";
import { landingPageConfig } from "../content/landingContent";

export default function HomePage() {
  return (
    <MarketingLayout navLinks={landingPageConfig.nav ?? []}>
      <StructuredData />
      <ViewportEvent eventName="lp_view" />
      <MarketingPageRenderer blocks={landingPageConfig.blocks} />
    </MarketingLayout>
  );
}
