import { NextResponse } from "next/server";
import { reorderAdminTemplates, writeAuditLog } from "../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../lib/admin/requireAdmin";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to perform this action." },
  },
  { status: 403 }
);

export async function POST(request: Request) {
  const ctx = await requireAdminPermissionForApi("templates.reorder");
  if (!ctx) return FORBIDDEN;

  const payload = ((await request.json().catch(() => null)) ?? {}) as {
    items?: Array<{ templateId?: unknown; displayOrder?: unknown }>;
  };

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "BAD_REQUEST", message: "items is required." },
      },
      { status: 400 }
    );
  }

  const items = payload.items
    .filter(
      (item): item is { templateId: string; displayOrder: number } =>
        typeof item?.templateId === "string" && typeof item?.displayOrder === "number"
    )
    .map((item) => ({
      templateId: item.templateId,
      displayOrder: item.displayOrder,
    }));

  if (items.length !== payload.items.length) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "BAD_REQUEST", message: "Each reorder item must include templateId and displayOrder." },
      },
      { status: 400 }
    );
  }

  const result = await reorderAdminTemplates(items);
  if (!result.ok || !result.data.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.ok ? result.data.code ?? "TEMPLATE_REORDER_FAILED" : "TEMPLATE_REORDER_FAILED",
          message: result.ok ? result.data.errors?.[0] ?? "Templates could not be reordered." : result.error,
        },
      },
      { status: 400 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_reordered",
    resourceType: "template_catalog",
    resourceId: "list",
    action: "reorder",
    metadataJson: {
      count: result.data.count ?? items.length,
    },
  });

  return NextResponse.json({ success: true, message: "Template order updated." });
}
