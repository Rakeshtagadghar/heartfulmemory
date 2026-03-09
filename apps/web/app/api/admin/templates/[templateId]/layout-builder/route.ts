import { NextResponse } from "next/server";
import {
  buildAdminTemplateLayoutBuilderLoadResponse,
} from "../../../../../../../../packages/shared/admin/templateLayoutBuilder";
import { coerceTemplateLayoutDefinition } from "../../../../../../../../packages/shared/templates/layoutTypes";
import {
  getAdminTemplateDetail,
  getAdminTemplateLayouts,
  updateAdminTemplateLayouts,
  writeAuditLog,
} from "../../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../../lib/admin/requireAdmin";

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

function parseSelectedLayoutId(body: unknown) {
  const payload = (body ?? {}) as Record<string, unknown>;
  return typeof payload.selectedLayoutId === "string" && payload.selectedLayoutId.trim().length > 0
    ? payload.selectedLayoutId
    : undefined;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("templates.view");
  if (!ctx) return FORBIDDEN;

  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);
  const [template, layouts] = await Promise.all([
    getAdminTemplateDetail(templateId),
    getAdminTemplateLayouts(templateId),
  ]);

  if (!template || !layouts) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Template not found." } },
      { status: 404 }
    );
  }

  const selectedLayoutId =
    new URL(request.url).searchParams.get("layoutId") ?? undefined;
  const data = buildAdminTemplateLayoutBuilderLoadResponse({
    templateId: template.id,
    templateName: template.name,
    templateStatus: template.status,
    canManage: ctx.permissions.includes("templates.manage"),
    lastSavedAt: template.updatedAt,
    publishedVersionRef: template.status === "published" ? `template:${template.id}:v${template.updatedAt}` : null,
    layoutDefinition: layouts.layoutDefinition,
    selectedLayoutId,
  });

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_builder_opened",
    resourceType: "template",
    resourceId: templateId,
    action: "open_layout_builder",
    metadataJson: {
      selectedLayoutId: data.selectedLayoutId,
      canManage: data.canManage,
    },
  });

  return NextResponse.json({ success: true, data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("templates.manage");
  if (!ctx) return FORBIDDEN;

  const body = await request.json().catch(() => null);
  const layoutDefinition = parseLayoutPayload(body);
  if (!layoutDefinition) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Layout payload is invalid." } },
      { status: 400 }
    );
  }
  const selectedLayoutId = parseSelectedLayoutId(body);

  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);
  const [template, result] = await Promise.all([
    getAdminTemplateDetail(templateId),
    updateAdminTemplateLayouts(templateId, layoutDefinition),
  ]);

  if (!result.ok || !result.data.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.ok ? result.data.code ?? "TEMPLATE_LAYOUT_BUILDER_SAVE_FAILED" : "TEMPLATE_LAYOUT_BUILDER_SAVE_FAILED",
          message: result.ok ? result.data.errors?.[0] ?? "Template builder draft could not be saved." : result.error,
          validation: result.ok ? result.data.validation ?? null : null,
        },
      },
      { status: result.ok && result.data.code === "NOT_FOUND" ? 404 : 400 }
    );
  }

  const data = buildAdminTemplateLayoutBuilderLoadResponse({
    templateId,
    templateName: template?.name ?? templateId,
    templateStatus: template?.status ?? "draft",
    canManage: true,
    lastSavedAt: Date.now(),
    publishedVersionRef: template?.status === "published" ? `template:${template.id}:v${template.updatedAt}` : null,
    layoutDefinition,
    selectedLayoutId,
  });

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_builder_saved",
    resourceType: "template",
    resourceId: templateId,
    action: "save_layout_builder_draft",
    metadataJson: {
      selectedLayoutId: data.selectedLayoutId,
      layoutCount: layoutDefinition.pageLayouts.length,
      chapterPlanCount: layoutDefinition.chapterPagePlans.length,
    },
  });

  return NextResponse.json({ success: true, data });
}
