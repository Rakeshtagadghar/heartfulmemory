import { NextResponse } from "next/server";
import { requireAdminPermissionForApi } from "../../../../../lib/admin/requireAdmin";
import { getUserDetail, writeAuditLog } from "../../../../../lib/admin/adminOps";

const FORBIDDEN = NextResponse.json(
  { success: false, error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." } },
  { status: 403 }
);

/** GET /api/admin/users/:userId — user detail with linked projects */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("users.view");
  if (!ctx) return FORBIDDEN;

  const { userId } = await params;
  const user = await getUserDetail(userId);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Resource not found." } },
      { status: 404 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_user_viewed",
    resourceType: "user",
    resourceId: userId,
    action: "view",
  });

  return NextResponse.json({ success: true, data: user });
}
