import { NextResponse } from "next/server";
import {
  ADMIN_TEMPLATE_BUILDER_PREVIEW_MODES,
  buildAdminTemplateLayoutPreview,
  type AdminTemplateBuilderPreviewMode,
} from "../../../../../../../../../packages/shared/admin/templateLayoutBuilder";
import { coerceTemplateLayoutDefinition } from "../../../../../../../../../packages/shared/templates/layoutTypes";
import { getAdminTemplateLayouts, writeAuditLog } from "../../../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../../../lib/admin/requireAdmin";

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
  if (candidate === undefined) return undefined;
  return coerceTemplateLayoutDefinition(candidate);
}

function parsePreviewMode(value: unknown): AdminTemplateBuilderPreviewMode {
  return (ADMIN_TEMPLATE_BUILDER_PREVIEW_MODES as readonly string[]).includes(String(value))
    ? (value as AdminTemplateBuilderPreviewMode)
    : "sample_content";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("templates.view");
  if (!ctx) return FORBIDDEN;

  const body = await request.json().catch(() => null);
  const layoutDefinition = parseLayoutPayload(body);
  const previewMode = parsePreviewMode((body as Record<string, unknown> | null)?.previewMode);
  const pageLayoutId = typeof (body as Record<string, unknown> | null)?.pageLayoutId === "string"
    ? String((body as Record<string, unknown>).pageLayoutId)
    : null;

  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);
  const stored = await getAdminTemplateLayouts(templateId);
  const sourceLayoutDefinition = layoutDefinition ?? stored?.layoutDefinition ?? null;

  if (!sourceLayoutDefinition) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Template not found." } },
      { status: 404 }
    );
  }

  const selectedLayoutId =
    pageLayoutId ??
    sourceLayoutDefinition.pageLayouts[0]?.pageLayoutId ??
    "";
  const data = buildAdminTemplateLayoutPreview(sourceLayoutDefinition, selectedLayoutId, previewMode);

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_builder_preview_generated",
    resourceType: "template",
    resourceId: templateId,
    action: "preview_layout_builder",
    metadataJson: {
      pageLayoutId: selectedLayoutId,
      previewMode,
      warningCount: data.warnings.length,
    },
  });

  return NextResponse.json({ success: true, data });
}
