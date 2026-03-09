import { NextResponse } from "next/server";
import { getAdminSubscriptionDetail, writeAuditLog } from "../../../../../../lib/admin/adminOps";
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
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("billing.view");
  if (!ctx) return FORBIDDEN;

  const { subscriptionId: rawSubscriptionId } = await params;
  const subscriptionId = decodeURIComponent(rawSubscriptionId);
  const subscription = await getAdminSubscriptionDetail(subscriptionId);

  if (!subscription) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Resource not found." } },
      { status: 404 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_subscription_viewed",
    resourceType: "subscription",
    resourceId: subscriptionId,
    action: "view",
    metadataJson: {
      userId: subscription.userId,
      planCode: subscription.planCode,
      status: subscription.status,
      mode: subscription.mode,
    },
  });

  return NextResponse.json({ success: true, data: { subscription } });
}
