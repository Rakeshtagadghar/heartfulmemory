import { NextResponse } from "next/server";
import { hasPermission } from "../../../../../../../packages/shared/admin/rbac";
import { getAdminExportJobDetail, writeAuditLog } from "../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../lib/admin/requireAdmin";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." },
  },
  { status: 403 }
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ exportId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("exports.view");
  if (!ctx) return FORBIDDEN;

  const { exportId } = await params;
  const exportJob = await getAdminExportJobDetail(exportId, {
    includeOwnerEmail: hasPermission(ctx.role, "users.view"),
    includeFailureSummary: hasPermission(ctx.role, "support.view"),
  });

  if (!exportJob) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Resource not found." } },
      { status: 404 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_export_viewed",
    resourceType: "export",
    resourceId: exportId,
    action: "view",
    metadataJson: {
      source: exportJob.source,
      projectId: exportJob.projectId,
      status: exportJob.status,
    },
  });

  return NextResponse.json({ success: true, data: { job: exportJob } });
}
