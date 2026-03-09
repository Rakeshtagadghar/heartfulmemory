import { NextResponse } from "next/server";
import { hasPermission } from "../../../../../../../../packages/shared/admin/rbac";
import { getAdminProjectExportHistory, writeAuditLog } from "../../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../../lib/admin/requireAdmin";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." },
  },
  { status: 403 }
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("exports.view");
  if (!ctx) return FORBIDDEN;

  const { projectId } = await params;
  const url = new URL(request.url);
  const parsedLimit = Number(url.searchParams.get("limit") ?? 10);
  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(50, Math.floor(parsedLimit))) : 10;
  const history = await getAdminProjectExportHistory(projectId, limit, {
    includeOwnerEmail: hasPermission(ctx.role, "users.view"),
    includeFailureSummary: hasPermission(ctx.role, "support.view"),
  });

  if (!history) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Resource not found." } },
      { status: 404 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_project_exports_viewed",
    resourceType: "project",
    resourceId: projectId,
    action: "view",
    metadataJson: {
      limit,
      total: history.total,
    },
  });

  return NextResponse.json({ success: true, data: history });
}
