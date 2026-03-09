import { NextResponse } from "next/server";
import { requireAdminPermissionForApi } from "../../../../../lib/admin/requireAdmin";
import { getProjectDetail, writeAuditLog } from "../../../../../lib/admin/adminOps";

const FORBIDDEN = NextResponse.json(
  { success: false, error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." } },
  { status: 403 }
);

/** GET /api/admin/projects/:projectId — read-only project detail */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("projects.view");
  if (!ctx) return FORBIDDEN;

  const { projectId } = await params;
  const project = await getProjectDetail(projectId);

  if (!project) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Resource not found." } },
      { status: 404 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_project_viewed",
    resourceType: "project",
    resourceId: projectId,
    action: "view",
  });

  return NextResponse.json({ success: true, data: project });
}
