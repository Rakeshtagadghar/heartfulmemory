import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminPermissionForApiMock = vi.fn();
const getAdminUserBillingDetailMock = vi.fn();
const writeAuditLogMock = vi.fn();

vi.mock("../../lib/admin/requireAdmin", () => ({
  requireAdminPermissionForApi: (...args: unknown[]) => requireAdminPermissionForApiMock(...args),
}));

vi.mock("../../lib/admin/adminOps", () => ({
  getAdminUserBillingDetail: (...args: unknown[]) => getAdminUserBillingDetailMock(...args),
  writeAuditLog: (...args: unknown[]) => writeAuditLogMock(...args),
}));

describe("admin billing routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns forbidden without billing permission", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(null);

    const { GET } = await import("../../app/api/admin/users/[userId]/billing/route");
    const response = await GET(new Request("http://localhost:3000/api/admin/users/user_1/billing"), {
      params: Promise.resolve({ userId: "user_1" }),
    });
    const body = (await response.json()) as { success: boolean; error: { code: string } };

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns support-safe billing detail for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue({
      adminId: "admin_1",
      userId: "user_admin",
      role: "support_admin",
      permissions: ["billing.view"],
      email: "admin@example.com",
    });
    getAdminUserBillingDetailMock.mockResolvedValue({
      userSummary: {
        userId: "user_1",
        displayName: "Casey",
        email: "casey@example.com",
      },
      planSummary: {
        planCode: "pro",
        planLabel: "Pro",
        features: ["Unlimited drafts"],
      },
      entitlements: {
        status: "active",
        canExportDigital: true,
        canExportHardcopy: true,
        exportsRemaining: 9,
      },
      subscriptionSummary: {
        id: "sub_row_1",
        providerSubscriptionRefMasked: "sub_...123456",
        providerCustomerRefMasked: "cus_...123456",
        status: "active",
        currentPeriodStart: 100,
        currentPeriodEnd: 200,
        cancelAtPeriodEnd: false,
        updatedAt: 300,
      },
      checkoutHistorySummary: {
        lastCheckoutStatus: "Checkout completed",
        lastBillingEventAt: 400,
      },
      paymentAttemptSummary: {
        status: "succeeded",
        latestInvoiceIdMasked: "in_...123456",
      },
      sandboxOrLiveStatus: "live",
      supportFlags: {
        hasCustomerRecord: true,
        hasSubscriptionRecord: true,
        needsRecovery: false,
      },
      manualOverrideState: null,
      recommendedSupportDiagnosis: null,
    });

    const { GET } = await import("../../app/api/admin/users/[userId]/billing/route");
    const response = await GET(new Request("http://localhost:3000/api/admin/users/user_1/billing"), {
      params: Promise.resolve({ userId: "user_1" }),
    });
    const body = (await response.json()) as {
      success: boolean;
      data: { billing: { sandboxOrLiveStatus: string } };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.billing.sandboxOrLiveStatus).toBe("live");
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_billing_viewed",
        resourceType: "user",
        resourceId: "user_1",
      })
    );
  });
});
