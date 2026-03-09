import { NextResponse } from "next/server";
import { requireAdminPermissionForApi } from "../../../../../lib/admin/requireAdmin";
import { updateAdminUser, writeAuditLog } from "../../../../../lib/admin/adminOps";

const FORBIDDEN = NextResponse.json(
  { success: false, error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." } },
  { status: 403 }
);

/** PATCH /api/admin/admin-users/:adminUserId — update role or status */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ adminUserId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("users.manage_admin_roles");
  if (!ctx) return FORBIDDEN;

  const { adminUserId } = await params;
  const body = await request.json();
  const { role, status } = body as { role?: string; status?: string };

  if (!role && !status) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "role or status is required." } },
      { status: 400 }
    );
  }

  // Only super_admin can promote to super_admin
  if (role === "super_admin" && ctx.role !== "super_admin") {
    return FORBIDDEN;
  }

  const patch: { role?: string; status?: string } = {};
  if (role) patch.role = role;
  if (status) patch.status = status;

  const result = await updateAdminUser(adminUserId, patch);

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: "CONFLICT", message: result.data?.error ?? "Update failed." } },
      { status: 409 }
    );
  }

  // Determine audit event type
  let eventType = "admin_role_changed";
  if (status === "disabled") eventType = "admin_role_disabled";
  if (status === "active" && !role) eventType = "admin_role_reactivated";

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType,
    resourceType: "admin_user",
    resourceId: adminUserId,
    action: "update_role",
    metadataJson: { ...patch },
  });

  return NextResponse.json({ success: true });
}
