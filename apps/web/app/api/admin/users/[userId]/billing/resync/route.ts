import { NextResponse } from "next/server";
import { anyApi, convexQuery } from "../../../../../../../lib/convex/ops";
import { recoverBillingSubscriptionForUser } from "../../../../../../../lib/billing/recovery";
import { writeAuditLog } from "../../../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../../../lib/admin/requireAdmin";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "BILLING_ACTION_FORBIDDEN", message: "You do not have permission to perform this billing support action." },
  },
  { status: 403 }
);

function parseBody(body: unknown) {
  const payload = (body ?? {}) as { reason?: unknown; note?: unknown };
  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
  const note = typeof payload.note === "string" ? payload.note.trim() : "";
  return { reason, note };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("billing.support_action");
  if (!ctx) return FORBIDDEN;

  const body = parseBody(await request.json().catch(() => null));
  if (!body.reason || !body.note) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "reason and note are required.",
        },
      },
      { status: 400 }
    );
  }

  const { userId: rawUserId } = await params;
  const userId = decodeURIComponent(rawUserId);
  const serverToken = process.env.BILLING_RECOVERY_TOKEN ?? "";
  if (!serverToken) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BILLING_RECOVERY_MISCONFIGURED",
          message: "BILLING_RECOVERY_TOKEN is not configured.",
        },
      },
      { status: 500 }
    );
  }

  const customerResult = await convexQuery<{
    stripeCustomerId: string;
  } | null>(anyApi.billing.getCustomerByUserIdFromSupport, {
    serverToken,
    userId,
  });

  if (!customerResult.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BILLING_RESYNC_LOOKUP_FAILED",
          message: customerResult.error,
        },
      },
      { status: 500 }
    );
  }

  if (!customerResult.data?.stripeCustomerId) {
    void writeAuditLog({
      adminUserId: ctx.adminId,
      actorUserId: ctx.userId,
      eventType: "admin_billing_action_blocked",
      resourceType: "user",
      resourceId: userId,
      action: "billing_resync",
      metadataJson: {
        reason: body.reason,
        note: body.note,
        code: "CUSTOMER_NOT_FOUND",
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CUSTOMER_NOT_FOUND",
          message: "No billing customer record is stored for this user.",
        },
      },
      { status: 409 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_billing_resync_requested",
    resourceType: "user",
    resourceId: userId,
    action: "billing_resync",
    metadataJson: {
      reason: body.reason,
      note: body.note,
    },
  });

  const result = await recoverBillingSubscriptionForUser(
    userId,
    customerResult.data.stripeCustomerId
  );

  if (!result.ok) {
    void writeAuditLog({
      adminUserId: ctx.adminId,
      actorUserId: ctx.userId,
      eventType: "admin_billing_action_blocked",
      resourceType: "user",
      resourceId: userId,
      action: "billing_resync",
      metadataJson: {
        reason: body.reason,
        note: body.note,
        code: result.code,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.code,
          message: result.message,
        },
      },
      { status: result.code === "SUBSCRIPTION_NOT_FOUND" ? 409 : 500 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_billing_resync_completed",
    resourceType: "user",
    resourceId: userId,
    action: "billing_resync",
    metadataJson: {
      reason: body.reason,
      note: body.note,
      subscriptionId: result.subscriptionId,
      status: result.status,
    },
  });

  return NextResponse.json({
    success: true,
    action: "billing_resync",
    status: "completed",
    message: "Billing state was resynced from the provider.",
    data: {
      subscriptionId: result.subscriptionId,
      subscriptionStatus: result.status,
    },
  });
}
