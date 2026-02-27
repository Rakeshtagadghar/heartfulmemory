import { beforeEach, describe, expect, it, vi } from "vitest";

const requireExportAccessMock = vi.fn();
const convexQueryMock = vi.fn();

vi.mock("../../lib/convex/ops", () => ({
  anyApi: {
    billing: {
      getEntitlementsForViewer: "getEntitlementsForViewer"
    }
  },
  getConvexUrl: () => "https://convex.example",
  convexQuery: (...args: unknown[]) => convexQueryMock(...args),
  convexMutation: vi.fn()
}));

vi.mock("../../lib/export/authz", () => ({
  requireExportAccess: (...args: unknown[]) => requireExportAccessMock(...args)
}));

vi.mock("../../lib/export/rateLimit", () => ({
  checkExportRateLimit: () => ({ ok: true })
}));

vi.mock("../../../../lib/observability/capture", () => ({
  captureAppError: vi.fn(),
  captureAppWarning: vi.fn()
}));

vi.mock("../../../../lib/observability/spans", () => ({
  withSentrySpan: async (_name: string, _attrs: unknown, callback: () => Promise<unknown>) => callback()
}));

import { POST } from "../../app/api/export/pdf/route";

describe("POST /api/export/pdf quota enforcement", () => {
  beforeEach(() => {
    process.env.BILLING_ENFORCE_EXPORT_GATING = "true";
    requireExportAccessMock.mockReset();
    convexQueryMock.mockReset();
  });

  it("blocks export with EXPORT_QUOTA_EXCEEDED when quota is exhausted", async () => {
    requireExportAccessMock.mockResolvedValue({ id: "user_1" });
    convexQueryMock.mockResolvedValue({
      ok: true,
      data: {
        entitlements: {
          planId: "pro",
          subscriptionStatus: "active",
          canExportDigital: true,
          canExportHardcopy: true,
          exportsRemaining: 0
        },
        usage: {
          used: 100,
          periodStart: Date.UTC(2026, 1, 1, 0, 0, 0, 0),
          periodEnd: Date.UTC(2026, 2, 1, 0, 0, 0, 0)
        }
      }
    });

    const request = new Request("http://localhost:3000/api/export/pdf", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        storybookId: "storybook_1",
        exportTarget: "DIGITAL_PDF"
      })
    });

    const response = await POST(request);
    const body = (await response.json()) as {
      ok: boolean;
      code: string;
      details?: { planId?: string };
    };

    expect(response.status).toBe(402);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("EXPORT_QUOTA_EXCEEDED");
    expect(body.details?.planId).toBe("pro");
  });
});
