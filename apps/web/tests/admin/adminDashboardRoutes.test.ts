import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminPermissionForApiMock = vi.fn();
const getAdminDashboardSummaryMock = vi.fn();
const writeAuditLogMock = vi.fn();

vi.mock("../../lib/admin/requireAdmin", () => ({
  requireAdminPermissionForApi: (...args: unknown[]) => requireAdminPermissionForApiMock(...args),
}));

vi.mock("../../lib/admin/adminOps", () => ({
  getAdminDashboardSummary: (...args: unknown[]) => getAdminDashboardSummaryMock(...args),
  writeAuditLog: (...args: unknown[]) => writeAuditLogMock(...args),
}));

describe("admin dashboard summary route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns forbidden without dashboard permission", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(null);

    const { GET } = await import("../../app/api/admin/dashboard/summary/route");
    const response = await GET(new Request("http://localhost:3000/api/admin/dashboard/summary"));
    const body = (await response.json()) as { success: boolean; error: { code: string } };

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns a dashboard summary and omits billing data for roles without billing access", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue({
      adminId: "admin_1",
      userId: "user_admin",
      role: "support_admin",
      permissions: ["dashboard.view"],
      email: "admin@example.com",
    });
    getAdminDashboardSummaryMock.mockResolvedValue({
      range: {
        preset: "7d",
        dateFrom: "2026-03-02T00:00:00.000Z",
        dateTo: "2026-03-09T12:00:00.000Z",
        label: "Last 7 days",
      },
      kpis: {
        totalUsers: { value: 10, unit: "count", delta: 2, deltaLabel: "vs prior", secondaryValue: 3, secondaryLabel: "new" },
        activeUsers: { value: 4, unit: "count", delta: 1, deltaLabel: "vs prior", secondaryValue: 40, secondaryLabel: "activity rate" },
        booksCreated: { value: 7, unit: "count", delta: 2, deltaLabel: "vs prior", secondaryValue: 2, secondaryLabel: "in range" },
        exportSuccessRate: { value: 80, unit: "percentage", delta: 5, deltaLabel: "vs prior", secondaryValue: 8, secondaryLabel: "successful exports" },
      },
      funnel: {
        available: true,
        reason: null,
        stages: [],
        largestDropoffStageId: null,
      },
      bookStatusBreakdown: { items: [] },
      exportStatusBreakdown: { items: [] },
      billingPlanSnapshot: null,
      recentErrors: {
        available: false,
        reason: "Unavailable",
        count: 0,
        affectedUsers: null,
        topCategories: [],
        latestItems: [],
      },
      recentSignups: { items: [] },
      recentFailedExports: { items: [] },
      recentAlerts: { items: [] },
      lastUpdatedAt: 123,
    });

    const { GET } = await import("../../app/api/admin/dashboard/summary/route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/admin/dashboard/summary?rangePreset=7d&dateFrom=2026-03-02&dateTo=2026-03-09"
      )
    );
    const body = (await response.json()) as {
      success: boolean;
      data: { range: { preset: string } };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.range.preset).toBe("7d");
    expect(getAdminDashboardSummaryMock).toHaveBeenCalledWith({
      preset: "7d",
      dateFrom: "2026-03-02",
      dateTo: "2026-03-09",
      includeBillingSnapshot: false,
    });
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_dashboard_viewed",
        resourceType: "dashboard",
        resourceId: "summary",
      })
    );
  });
});
