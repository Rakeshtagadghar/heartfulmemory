import { NextResponse } from "next/server";
import {
  createAdminTemplate,
  listAdminTemplates,
  writeAuditLog,
} from "../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../lib/admin/requireAdmin";
import {
  normalizeAdminTemplateCategory,
  normalizeAdminTemplateCompatibilityFilter,
  normalizeAdminTemplateGuidedLevel,
  normalizeAdminTemplateStatus,
  normalizeAdminTemplateType,
  normalizeAdminTemplateVisibility,
  type CreateAdminTemplateInput,
} from "../../../../../../packages/shared/admin/templates";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." },
  },
  { status: 403 }
);

function parseTemplateCreateBody(body: unknown): CreateAdminTemplateInput | null {
  const payload = (body ?? {}) as Record<string, unknown>;
  const type = normalizeAdminTemplateType(typeof payload.type === "string" ? payload.type : null);
  const visibility = normalizeAdminTemplateVisibility(
    typeof payload.visibility === "string" ? payload.visibility : null
  );
  const category = normalizeAdminTemplateCategory(
    typeof payload.category === "string" ? payload.category : null
  );
  const guidedLevel = normalizeAdminTemplateGuidedLevel(
    typeof payload.guidedLevel === "string" ? payload.guidedLevel : null
  );

  if (!type || !visibility || !category || !guidedLevel) {
    return null;
  }

  return {
    slug: typeof payload.slug === "string" ? payload.slug : "",
    name: typeof payload.name === "string" ? payload.name : "",
    description: typeof payload.description === "string" ? payload.description : "",
    type,
    visibility,
    category,
    guidedLevel,
    displayOrder:
      typeof payload.displayOrder === "number" && Number.isFinite(payload.displayOrder)
        ? payload.displayOrder
        : null,
    supportsPortrait: Boolean(payload.supportsPortrait),
    supportsLandscape: Boolean(payload.supportsLandscape),
    supportsReflowMode: Boolean(payload.supportsReflowMode),
    supportsPdfExport: Boolean(payload.supportsPdfExport),
  };
}

export async function GET(request: Request) {
  const ctx = await requireAdminPermissionForApi("templates.view");
  if (!ctx) return FORBIDDEN;

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const status = normalizeAdminTemplateStatus(url.searchParams.get("status"));
  const type = normalizeAdminTemplateType(url.searchParams.get("type"));
  const visibility = normalizeAdminTemplateVisibility(url.searchParams.get("visibility"));
  const category = normalizeAdminTemplateCategory(url.searchParams.get("category"));
  const guidedLevel = normalizeAdminTemplateGuidedLevel(url.searchParams.get("guidedLevel"));
  const compatibility = normalizeAdminTemplateCompatibilityFilter(
    url.searchParams.get("compatibility")
  );
  const page = Number(url.searchParams.get("page") ?? 1);
  const pageSize = Number(url.searchParams.get("pageSize") ?? 25);
  const data = await listAdminTemplates({
    q,
    status,
    type,
    visibility,
    category,
    guidedLevel,
    compatibility,
    page,
    pageSize,
  });

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_templates_viewed",
    resourceType: "template_catalog",
    resourceId: "list",
    action: "view",
    metadataJson: {
      q: q ? `${q.slice(0, 3)}***` : null,
      status,
      type,
      visibility,
      category,
      guidedLevel,
      compatibility,
      resultCount: data.pagination.total,
    },
  });

  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const ctx = await requireAdminPermissionForApi("templates.manage");
  if (!ctx) return FORBIDDEN;

  const body = parseTemplateCreateBody(await request.json().catch(() => null));
  if (!body) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "BAD_REQUEST", message: "Template payload is invalid." },
      },
      { status: 400 }
    );
  }

  const result = await createAdminTemplate(body);
  if (!result.ok || !result.data.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.ok ? result.data.code ?? "TEMPLATE_CREATE_FAILED" : "TEMPLATE_CREATE_FAILED",
          message: result.ok ? result.data.errors?.[0] ?? "Template could not be created." : result.error,
        },
      },
      { status: result.ok && result.data.code === "SLUG_NOT_UNIQUE" ? 409 : 400 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_created",
    resourceType: "template",
    resourceId: result.data.templateId ?? body.slug,
    action: "create",
    metadataJson: {
      slug: body.slug,
      type: body.type,
      visibility: body.visibility,
      category: body.category,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      templateId: result.data.templateId,
    },
  });
}
