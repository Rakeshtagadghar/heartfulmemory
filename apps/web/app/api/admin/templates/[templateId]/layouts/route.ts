import { NextResponse } from "next/server";
import {
  getAdminTemplateLayouts,
  updateAdminTemplateLayouts,
  writeAuditLog,
} from "../../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../../lib/admin/requireAdmin";
import { coerceTemplateLayoutDefinition } from "../../../../../../../../packages/shared/templates/layoutTypes";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." },
  },
  { status: 403 }
);

function parseLayoutPayload(body: unknown) {
  const payload = (body ?? {}) as Record<string, unknown>;
  const candidate = "layoutDefinition" in payload ? payload.layoutDefinition : payload;
  return coerceTemplateLayoutDefinition(candidate);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("templates.view");
  if (!ctx) return FORBIDDEN;

  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);
  const data = await getAdminTemplateLayouts(templateId);

  if (!data) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Template not found." } },
      { status: 404 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_layouts_viewed",
    resourceType: "template",
    resourceId: templateId,
    action: "view_layouts",
  });

  return NextResponse.json({ success: true, data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("templates.manage");
  if (!ctx) return FORBIDDEN;

  const layoutDefinition = parseLayoutPayload(await request.json().catch(() => null));
  if (!layoutDefinition) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Layout payload is invalid." } },
      { status: 400 }
    );
  }

  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);
  const result = await updateAdminTemplateLayouts(templateId, layoutDefinition);

  if (!result.ok || !result.data.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.ok ? result.data.code ?? "TEMPLATE_LAYOUT_UPDATE_FAILED" : "TEMPLATE_LAYOUT_UPDATE_FAILED",
          message: result.ok ? result.data.errors?.[0] ?? "Template layouts could not be updated." : result.error,
          validation: result.ok ? result.data.validation ?? null : null,
        },
      },
      { status: result.ok && result.data.code === "NOT_FOUND" ? 404 : 400 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_layouts_updated",
    resourceType: "template",
    resourceId: templateId,
    action: "update_layouts",
    metadataJson: {
      layoutSchemaVersion: layoutDefinition.layoutSchemaVersion,
      pageLayoutCount: layoutDefinition.pageLayouts.length,
      chapterPlanCount: layoutDefinition.chapterPagePlans.length,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      validation: result.data.validation ?? null,
    },
  });
}
