import { NextResponse } from "next/server";
import { setAdminTemplateDefault, writeAuditLog } from "../../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../../lib/admin/requireAdmin";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." },
  },
  { status: 403 }
);

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("templates.manage");
  if (!ctx) return FORBIDDEN;

  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);
  const result = await setAdminTemplateDefault(templateId);

  if (!result.ok || !result.data.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.ok ? result.data.code ?? "TEMPLATE_DEFAULT_FAILED" : "TEMPLATE_DEFAULT_FAILED",
          message: result.ok ? result.data.errors?.[0] ?? "Template could not be set as default." : result.error,
        },
      },
      { status: 409 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_default_changed",
    resourceType: "template",
    resourceId: templateId,
    action: "set_default",
  });

  return NextResponse.json({ success: true, message: "Default template updated." });
}
