import { NextResponse } from "next/server";
import {
  buildAdminTemplateLayoutBuilderValidation,
} from "../../../../../../../../../packages/shared/admin/templateLayoutBuilder";
import { coerceTemplateLayoutDefinition } from "../../../../../../../../../packages/shared/templates/layoutTypes";
import {
  getAdminTemplateLayouts,
  validateAdminTemplateLayouts,
  writeAuditLog,
} from "../../../../../../../lib/admin/adminOps";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("templates.manage");
  if (!ctx) return FORBIDDEN;

  const body = await request.json().catch(() => null);
  const explicitPayload = body !== null && body !== undefined && Object.keys((body ?? {}) as Record<string, unknown>).length > 0;
  const parsedLayoutDefinition = parseLayoutPayload(body);
  if (explicitPayload && !parsedLayoutDefinition) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Layout payload is invalid." } },
      { status: 400 }
    );
  }

  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);

  const sourceLayoutDefinition = parsedLayoutDefinition ?? (await getAdminTemplateLayouts(templateId))?.layoutDefinition;
  if (!sourceLayoutDefinition) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Template not found." } },
      { status: 404 }
    );
  }

  const canonicalResult = await validateAdminTemplateLayouts(templateId, parsedLayoutDefinition ?? undefined);
  if (!canonicalResult.ok || (!canonicalResult.data.ok && canonicalResult.data.code === "NOT_FOUND")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: canonicalResult.ok ? canonicalResult.data.code ?? "TEMPLATE_LAYOUT_BUILDER_VALIDATE_FAILED" : "TEMPLATE_LAYOUT_BUILDER_VALIDATE_FAILED",
          message: canonicalResult.ok ? canonicalResult.data.errors?.[0] ?? "Builder validation failed." : canonicalResult.error,
        },
      },
      { status: canonicalResult.ok && canonicalResult.data.code === "NOT_FOUND" ? 404 : 400 }
    );
  }

  const data = buildAdminTemplateLayoutBuilderValidation(sourceLayoutDefinition);

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_builder_validate_run",
    resourceType: "template",
    resourceId: templateId,
    action: "validate_layout_builder",
    metadataJson: {
      isValid: data.isValid,
      errorCount: data.errors.length,
      warningCount: data.warnings.length,
    },
  });

  return NextResponse.json({ success: true, data });
}
