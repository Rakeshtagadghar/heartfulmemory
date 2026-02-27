import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { defaultStorybookExportSettingsV1 } from "../../../../packages/shared-schema/storybookSettings.types";

const useEntitlementsMock = vi.fn();

vi.mock("../../lib/billing/useEntitlements", () => ({
  useEntitlements: (...args: unknown[]) => useEntitlementsMock(...args)
}));

vi.mock("../../lib/analytics/studioExportEvents", () => ({
  trackStudioExportClickBlocked: vi.fn(),
  trackStudioExportClickAllowed: vi.fn()
}));

vi.mock("../../lib/analytics/billingEvents", () => ({
  trackPaywallShown: vi.fn(),
  trackPaywallUpgradeClick: vi.fn(),
  trackCheckoutRedirected: vi.fn()
}));

vi.mock("../../components/editor2/ExportHistory", () => ({
  ExportHistory: () => <div data-testid="export-history-mock" />
}));

import { ExportButton } from "../../components/editor2/ExportButton";

describe("Export paywall gating", () => {
  beforeEach(() => {
    useEntitlementsMock.mockReset();
  });

  it("opens upgrade modal for free users", async () => {
    useEntitlementsMock.mockReturnValue({
      entitlements: {
        planId: "free",
        subscriptionStatus: "none",
        canExportDigital: false,
        canExportHardcopy: false,
        exportsRemaining: 0
      },
      loading: false,
      error: null
    });

    render(
      <ExportButton
        storybookId="storybook_1"
        storybookSettings={defaultStorybookExportSettingsV1}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Upgrade to Export" }));

    expect(await screen.findByRole("heading", { name: "Upgrade to Export" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Digital + Hardcopy Export" })).not.toBeInTheDocument();
  });

  it("opens export modal for pro users", async () => {
    useEntitlementsMock.mockReturnValue({
      entitlements: {
        planId: "pro",
        subscriptionStatus: "active",
        canExportDigital: true,
        canExportHardcopy: true,
        exportsRemaining: 40
      },
      loading: false,
      error: null
    });

    render(
      <ExportButton
        storybookId="storybook_1"
        storybookSettings={defaultStorybookExportSettingsV1}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Export" }));

    expect(await screen.findByRole("heading", { name: "Digital + Hardcopy Export" })).toBeInTheDocument();
  });
});
