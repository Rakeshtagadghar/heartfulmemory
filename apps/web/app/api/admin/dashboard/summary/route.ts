import { NextResponse } from "next/server";
import { getAdminDashboardSummary, writeAuditLog } from "../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../lib/admin/requireAdmin";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." },
  },
  { status: 403 }
);

export async function GET(request: Request) {
  const ctx = await requireAdminPermissionForApi("dashboard.view");
  if (!ctx) return FORBIDDEN;

  const url = new URL(request.url);
  const summary = await getAdminDashboardSummary({
    preset: url.searchParams.get("rangePreset"),
    dateFrom: url.searchParams.get("dateFrom"),
    dateTo: url.searchParams.get("dateTo"),
    includeBillingSnapshot: ctx.permissions.includes("billing.view"),
  });

  if (!summary) {
    return NextResponse.json(
      { success: false, error: { code: "DASHBOARD_UNAVAILABLE", message: "Dashboard summary is unavailable." } },
      { status: 500 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_dashboard_viewed",
    resourceType: "dashboard",
    resourceId: "summary",
    action: "view",
    metadataJson: {
      rangePreset: summary.range.preset,
      billingSnapshotVisible: ctx.permissions.includes("billing.view"),
    },
  });

  return NextResponse.json({ success: true, data: summary });
}
