import { render, screen } from "@testing-library/react";
import { UpgradeModal } from "../../components/billing/UpgradeModal";
import { alphaMessaging } from "../../content/alphaMessaging";

const mockUsePlanStatus = vi.fn();

vi.mock("../../lib/billing/usePlanStatus", () => ({
  usePlanStatus: (...args: unknown[]) => mockUsePlanStatus(...args)
}));

describe("upgrade modal sandbox visibility", () => {
  beforeEach(() => {
    mockUsePlanStatus.mockReset();
    mockUsePlanStatus.mockReturnValue({
      data: { billingModeIsTest: true }
    });
  });

  it("shows sandbox disclaimer and test card helper in test mode", () => {
    render(<UpgradeModal open onClose={() => undefined} />);

    expect(screen.getByText(alphaMessaging.sandboxHeadline)).toBeInTheDocument();
    expect(screen.getByText(alphaMessaging.sandboxSubheadline)).toBeInTheDocument();
    expect(screen.getByText(alphaMessaging.testCard.number)).toBeInTheDocument();
  });

  it("hides sandbox disclaimer in live mode", () => {
    mockUsePlanStatus.mockReturnValue({
      data: { billingModeIsTest: false }
    });

    render(<UpgradeModal open onClose={() => undefined} />);

    expect(screen.queryByText(alphaMessaging.sandboxHeadline)).not.toBeInTheDocument();
    expect(screen.queryByText(alphaMessaging.testCard.number)).not.toBeInTheDocument();
  });
});

