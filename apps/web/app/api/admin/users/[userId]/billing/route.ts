import { NextResponse } from "next/server";
import { getAdminUserBillingDetail, writeAuditLog } from "../../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../../lib/admin/requireAdmin";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." },
  },
  { status: 403 }
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("billing.view");
  if (!ctx) return FORBIDDEN;

  const { userId: rawUserId } = await params;
  const userId = decodeURIComponent(rawUserId);
  const billing = await getAdminUserBillingDetail(userId);

  if (!billing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Resource not found." } },
      { status: 404 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_billing_viewed",
    resourceType: "user",
    resourceId: userId,
    action: "view",
    metadataJson: {
      planCode: billing.planSummary.planCode,
      entitlementStatus: billing.entitlements.status,
      subscriptionStatus: billing.subscriptionSummary.status,
      billingMode: billing.sandboxOrLiveStatus,
    },
  });

  return NextResponse.json({ success: true, data: { billing } });
}
