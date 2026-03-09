import { NextResponse } from "next/server";
import { anyApi, convexMutation } from "../../../../../../../lib/convex/ops";
import { writeAuditLog } from "../../../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../../../lib/admin/requireAdmin";
import { isAllowedAdminManualEntitlementStatus } from "../../../../../../../../../packages/shared/admin/billingSupport";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "BILLING_ACTION_FORBIDDEN", message: "You do not have permission to perform this billing support action." },
  },
  { status: 403 }
);

function parseBody(body: unknown) {
  const payload = (body ?? {}) as {
    reason?: unknown;
    note?: unknown;
    entitlementStatus?: unknown;
    expiresAt?: unknown;
  };

  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
  const note = typeof payload.note === "string" ? payload.note.trim() : "";
  const entitlementStatus =
    typeof payload.entitlementStatus === "string"
      ? payload.entitlementStatus.trim()
      : "";
  const expiresAtInput =
    typeof payload.expiresAt === "string" ? payload.expiresAt.trim() : null;
  const expiresAt =
    expiresAtInput && expiresAtInput.length > 0
      ? Date.parse(expiresAtInput)
      : null;

  return {
    reason,
    note,
    entitlementStatus,
    expiresAt,
    rawExpiresAt: expiresAtInput,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("billing.support_action");
  if (!ctx) return FORBIDDEN;

  const body = parseBody(await request.json().catch(() => null));
  if (!body.reason || !body.note || !body.entitlementStatus) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "reason, note, and entitlementStatus are required.",
        },
      },
      { status: 400 }
    );
  }

  if (!isAllowedAdminManualEntitlementStatus(body.entitlementStatus)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNSUPPORTED_MANUAL_ENTITLEMENT",
          message: "This manual entitlement status is not allowed.",
        },
      },
      { status: 400 }
    );
  }

  if (
    body.rawExpiresAt &&
    (!Number.isFinite(body.expiresAt) || (body.expiresAt ?? 0) <= Date.now())
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "expiresAt must be a valid future date when provided.",
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

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_manual_entitlement_requested",
    resourceType: "user",
    resourceId: userId,
    action: "manual_entitlement",
    metadataJson: {
      reason: body.reason,
      note: body.note,
      entitlementStatus: body.entitlementStatus,
      expiresAt: body.expiresAt ?? null,
    },
  });

  const result = await convexMutation<{
    ok: boolean;
    override?: {
      id: string;
      entitlementStatus: string;
      expiresAt: number | null;
      active: boolean;
    } | null;
  }>(anyApi.billing.setManualEntitlementOverrideFromSupport, {
    serverToken,
    userId,
    entitlementStatus: body.entitlementStatus,
    expiresAt: body.expiresAt ?? null,
    reason: body.reason,
    note: body.note,
    createdByAdminUserId: ctx.adminId,
    createdByActorUserId: ctx.userId,
  });

  if (!result.ok || !result.data.ok) {
    void writeAuditLog({
      adminUserId: ctx.adminId,
      actorUserId: ctx.userId,
      eventType: "admin_billing_action_blocked",
      resourceType: "user",
      resourceId: userId,
      action: "manual_entitlement",
      metadataJson: {
        reason: body.reason,
        note: body.note,
        code: result.ok ? "MANUAL_ENTITLEMENT_FAILED" : result.error,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MANUAL_ENTITLEMENT_FAILED",
          message: result.ok ? "Manual entitlement could not be applied." : result.error,
        },
      },
      { status: 500 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_manual_entitlement_completed",
    resourceType: "user",
    resourceId: userId,
    action: "manual_entitlement",
    metadataJson: {
      reason: body.reason,
      note: body.note,
      entitlementStatus: body.entitlementStatus,
      expiresAt: body.expiresAt ?? null,
      overrideId: result.data.override?.id ?? null,
    },
  });

  return NextResponse.json({
    success: true,
    action: "temporary_manual_entitlement",
    status: "completed",
    message: "Manual entitlement override was applied.",
    data: {
      override: result.data.override ?? null,
    },
  });
}
