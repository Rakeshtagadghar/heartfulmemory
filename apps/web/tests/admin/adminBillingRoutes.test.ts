import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminPermissionForApiMock = vi.fn();
const getAdminUserBillingDetailMock = vi.fn();
const getAdminSubscriptionDetailMock = vi.fn();
const writeAuditLogMock = vi.fn();
const convexQueryMock = vi.fn();
const convexMutationMock = vi.fn();
const recoverBillingSubscriptionForUserMock = vi.fn();

vi.mock("../../lib/admin/requireAdmin", () => ({
  requireAdminPermissionForApi: (...args: unknown[]) => requireAdminPermissionForApiMock(...args),
}));

vi.mock("../../lib/admin/adminOps", () => ({
  getAdminUserBillingDetail: (...args: unknown[]) => getAdminUserBillingDetailMock(...args),
  getAdminSubscriptionDetail: (...args: unknown[]) => getAdminSubscriptionDetailMock(...args),
  writeAuditLog: (...args: unknown[]) => writeAuditLogMock(...args),
}));

vi.mock("../../lib/convex/ops", () => ({
  anyApi: {
    billing: {
      getCustomerByUserIdFromSupport: "mock:getCustomerByUserIdFromSupport",
      setManualEntitlementOverrideFromSupport: "mock:setManualEntitlementOverrideFromSupport",
    },
  },
  convexQuery: (...args: unknown[]) => convexQueryMock(...args),
  convexMutation: (...args: unknown[]) => convexMutationMock(...args),
}));

vi.mock("../../lib/billing/recovery", () => ({
  recoverBillingSubscriptionForUser: (...args: unknown[]) =>
    recoverBillingSubscriptionForUserMock(...args),
}));

describe("admin billing routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BILLING_RECOVERY_TOKEN = "test-token";
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

  it("returns support-safe subscription detail for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue({
      adminId: "admin_1",
      userId: "user_admin",
      role: "support_admin",
      permissions: ["billing.view"],
      email: "admin@example.com",
    });
    getAdminSubscriptionDetailMock.mockResolvedValue({
      subscriptionId: "sub_row_1",
      userId: "user_1",
      userDisplayName: "Casey",
      userEmail: "casey@example.com",
      providerSubscriptionRefMasked: "sub_...123456",
      providerCustomerRefMasked: "cus_...123456",
      planCode: "pro",
      planLabel: "Pro",
      status: "active",
      currentPeriodStart: 100,
      currentPeriodEnd: 200,
      cancelAtPeriodEnd: false,
      mode: "live",
      latestInvoiceIdMasked: "in_...123456",
      latestPaymentStatus: "succeeded",
      lastSyncedAt: 300,
      entitlementProjection: {
        status: "active",
        canExportDigital: true,
        canExportHardcopy: true,
        exportsRemaining: 12,
      },
      manualOverrideState: null,
    });

    const { GET } = await import("../../app/api/admin/billing/subscriptions/[subscriptionId]/route");
    const response = await GET(
      new Request("http://localhost:3000/api/admin/billing/subscriptions/sub_row_1"),
      { params: Promise.resolve({ subscriptionId: "sub_row_1" }) }
    );
    const body = (await response.json()) as {
      success: boolean;
      data: { subscription: { mode: string } };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.subscription.mode).toBe("live");
  });

  it("blocks billing resync without support action permission", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(null);

    const { POST } = await import("../../app/api/admin/users/[userId]/billing/resync/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/users/user_1/billing/resync", {
        method: "POST",
        body: JSON.stringify({ reason: "sync", note: "support" }),
      }),
      { params: Promise.resolve({ userId: "user_1" }) }
    );

    expect(response.status).toBe(403);
  });

  it("resyncs billing state for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue({
      adminId: "admin_1",
      userId: "user_admin",
      role: "support_admin",
      permissions: ["billing.support_action"],
      email: "admin@example.com",
    });
    convexQueryMock.mockResolvedValue({
      ok: true,
      data: { stripeCustomerId: "cus_123" },
    });
    recoverBillingSubscriptionForUserMock.mockResolvedValue({
      ok: true,
      subscriptionId: "sub_123",
      status: "active",
    });

    const { POST } = await import("../../app/api/admin/users/[userId]/billing/resync/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/users/user_1/billing/resync", {
        method: "POST",
        body: JSON.stringify({ reason: "fix mismatch", note: "customer paid" }),
      }),
      { params: Promise.resolve({ userId: "user_1" }) }
    );
    const body = (await response.json()) as { success: boolean; action: string };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.action).toBe("billing_resync");
    expect(recoverBillingSubscriptionForUserMock).toHaveBeenCalledWith("user_1", "cus_123");
  });

  it("applies a temporary manual entitlement with audit logging", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue({
      adminId: "admin_1",
      userId: "user_admin",
      role: "support_admin",
      permissions: ["billing.support_action"],
      email: "admin@example.com",
    });
    convexMutationMock.mockResolvedValue({
      ok: true,
      data: {
        ok: true,
        override: {
          id: "override_1",
          entitlementStatus: "manually_granted",
          expiresAt: null,
          active: true,
        },
      },
    });

    const { POST } = await import(
      "../../app/api/admin/users/[userId]/billing/manual-entitlement/route"
    );
    const response = await POST(
      new Request("http://localhost:3000/api/admin/users/user_1/billing/manual-entitlement", {
        method: "POST",
        body: JSON.stringify({
          reason: "restore access",
          note: "paid but entitlement stale",
          entitlementStatus: "manually_granted",
        }),
      }),
      { params: Promise.resolve({ userId: "user_1" }) }
    );
    const body = (await response.json()) as { success: boolean; action: string };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.action).toBe("temporary_manual_entitlement");
    expect(convexMutationMock).toHaveBeenCalled();
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_manual_entitlement_completed",
        resourceType: "user",
        resourceId: "user_1",
      })
    );
  });

  it("rejects unsupported manual entitlement statuses", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue({
      adminId: "admin_1",
      userId: "user_admin",
      role: "support_admin",
      permissions: ["billing.support_action"],
      email: "admin@example.com",
    });

    const { POST } = await import(
      "../../app/api/admin/users/[userId]/billing/manual-entitlement/route"
    );
    const response = await POST(
      new Request("http://localhost:3000/api/admin/users/user_1/billing/manual-entitlement", {
        method: "POST",
        body: JSON.stringify({
          reason: "bad request",
          note: "unsupported action",
          entitlementStatus: "suspended",
        }),
      }),
      { params: Promise.resolve({ userId: "user_1" }) }
    );
    const body = (await response.json()) as { success: boolean; error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNSUPPORTED_MANUAL_ENTITLEMENT");
  });
});
