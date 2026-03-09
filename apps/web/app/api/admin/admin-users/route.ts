import { NextResponse } from "next/server";
import { requireAdminPermissionForApi } from "../../../../lib/admin/requireAdmin";
import {
  listAllAdminUsers,
  createAdminUser,
  writeAuditLog,
} from "../../../../lib/admin/adminOps";

const FORBIDDEN = NextResponse.json(
  { success: false, error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." } },
  { status: 403 }
);

/** GET /api/admin/admin-users — list all admin users */
export async function GET() {
  const ctx = await requireAdminPermissionForApi("users.manage_admin_roles");
  if (!ctx) return FORBIDDEN;

  const admins = await listAllAdminUsers();
  return NextResponse.json({ success: true, data: admins });
}

/** POST /api/admin/admin-users — grant admin role to a user */
export async function POST(request: Request) {
  const ctx = await requireAdminPermissionForApi("users.manage_admin_roles");
  if (!ctx) return FORBIDDEN;

  const body = await request.json();
  const { userId, role } = body as { userId?: string; role?: string };

  if (!userId || !role) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "userId and role are required." } },
      { status: 400 }
    );
  }

  const validRoles = ["super_admin", "support_admin", "content_admin"];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid role." } },
      { status: 400 }
    );
  }

  // Prevent non-super_admin from granting super_admin
  if (role === "super_admin" && ctx.role !== "super_admin") {
    return FORBIDDEN;
  }

  const result = await createAdminUser(userId, role, ctx.userId);

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: "CONFLICT", message: result.error ?? "Failed to create admin." } },
      { status: 409 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_role_granted",
    resourceType: "admin_user",
    resourceId: userId,
    action: "update_role",
    metadataJson: { grantedRole: role },
  });

  return NextResponse.json({ success: true, data: { id: result.data?.id } }, { status: 201 });
}
