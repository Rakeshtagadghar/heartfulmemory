import { NextResponse } from "next/server";
import { getAdminContextForApi } from "../../../../lib/admin/requireAdmin";
import { recordAdminLogin, writeAuditLog } from "../../../../lib/admin/adminOps";

const FORBIDDEN = NextResponse.json(
  { success: false, error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." } },
  { status: 403 }
);

export async function GET() {
  const ctx = await getAdminContextForApi();
  if (!ctx) return FORBIDDEN;

  // Record login timestamp + audit log (fire-and-forget)
  void recordAdminLogin(ctx.userId);
  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_login_success",
    action: "access",
  });

  return NextResponse.json({
    success: true,
    data: {
      userId: ctx.userId,
      email: ctx.email,
      adminId: ctx.adminId,
      role: ctx.role,
      permissions: ctx.permissions,
    },
  });
}
