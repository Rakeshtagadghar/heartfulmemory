import { render, screen } from "@testing-library/react";
import { MarketingPageRenderer } from "../../components/marketing/PageRenderer";
import { landingPageConfig } from "../../content/landingContent";
import { alphaMessaging } from "../../content/alphaMessaging";

describe("landing alpha messaging", () => {
  it("shows early alpha badge and blurb above the fold", () => {
    const blocks = landingPageConfig.blocks.filter(
      (block) => block.type === "hero_split"
    );
    render(<MarketingPageRenderer blocks={blocks} />);

    expect(screen.getByText(alphaMessaging.alphaBadge)).toBeInTheDocument();
    expect(screen.getByText(alphaMessaging.alphaBlurbShort)).toBeInTheDocument();
  });

  it("includes alpha and sandbox FAQ entries", () => {
    const blocks = landingPageConfig.blocks.filter((block) => block.type === "faq");
    render(<MarketingPageRenderer blocks={blocks} />);

    expect(screen.getByRole("button", { name: alphaMessaging.alphaFaqQuestion })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: alphaMessaging.sandboxFaqQuestion })).toBeInTheDocument();
  });
});

