import { NextResponse } from "next/server";
import {
  validateAdminTemplateLayouts,
  writeAuditLog,
} from "../../../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../../../lib/admin/requireAdmin";
import { coerceTemplateLayoutDefinition } from "../../../../../../../../../packages/shared/templates/layoutTypes";

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

function hasExplicitLayoutPayload(body: unknown) {
  if (body === null || body === undefined) return false;
  if (typeof body !== "object" || Array.isArray(body)) return true;
  return Object.keys(body as Record<string, unknown>).length > 0;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("templates.manage");
  if (!ctx) return FORBIDDEN;

  const parsedBody = await request.json().catch(() => null);
  const layoutDefinition = parseLayoutPayload(parsedBody);
  if (hasExplicitLayoutPayload(parsedBody) && !layoutDefinition) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Layout payload is invalid." } },
      { status: 400 }
    );
  }

  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);
  const result = await validateAdminTemplateLayouts(templateId, layoutDefinition ?? undefined);

  if (!result.ok || (!result.data.ok && result.data.code === "NOT_FOUND")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.ok ? result.data.code ?? "TEMPLATE_LAYOUT_VALIDATE_FAILED" : "TEMPLATE_LAYOUT_VALIDATE_FAILED",
          message: result.ok ? result.data.errors?.[0] ?? "Template layouts could not be validated." : result.error,
        },
      },
      { status: result.ok && result.data.code === "NOT_FOUND" ? 404 : 400 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_layouts_validated",
    resourceType: "template",
    resourceId: templateId,
    action: "validate_layouts",
    metadataJson: {
      ok: result.ok ? result.data.ok : false,
      errorCount: result.ok ? result.data.validation?.errors.length ?? 0 : 0,
    },
  });

  return NextResponse.json({
    success: true,
    data: result.ok ? result.data : null,
  });
}
