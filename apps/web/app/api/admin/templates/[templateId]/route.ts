import { NextResponse } from "next/server";
import {
  getAdminTemplateDetail,
  updateAdminTemplate,
  writeAuditLog,
} from "../../../../../lib/admin/adminOps";
import { requireAdminPermissionForApi } from "../../../../../lib/admin/requireAdmin";
import {
  normalizeAdminTemplateCategory,
  normalizeAdminTemplateGuidedLevel,
  normalizeAdminTemplateType,
  normalizeAdminTemplateVisibility,
  type AdminTemplateQuestion,
  type UpdateAdminTemplateInput,
} from "../../../../../../../packages/shared/admin/templates";

const FORBIDDEN = NextResponse.json(
  {
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to access this resource." },
  },
  { status: 403 }
);

function parseTemplatePatchBody(body: unknown): UpdateAdminTemplateInput | null {
  const payload = (body ?? {}) as Record<string, unknown>;
  const patch: UpdateAdminTemplateInput = {};

  if (typeof payload.name === "string") patch.name = payload.name;
  if (typeof payload.description === "string") patch.description = payload.description;
  if (payload.type !== undefined) {
    const type = normalizeAdminTemplateType(
      typeof payload.type === "string" ? payload.type : null
    );
    if (!type) return null;
    patch.type = type;
  }
  if (payload.visibility !== undefined) {
    const visibility = normalizeAdminTemplateVisibility(
      typeof payload.visibility === "string" ? payload.visibility : null
    );
    if (!visibility) return null;
    patch.visibility = visibility;
  }
  if (payload.category !== undefined) {
    const category = normalizeAdminTemplateCategory(
      typeof payload.category === "string" ? payload.category : null
    );
    if (!category) return null;
    patch.category = category;
  }
  if (payload.guidedLevel !== undefined) {
    const guidedLevel = normalizeAdminTemplateGuidedLevel(
      typeof payload.guidedLevel === "string" ? payload.guidedLevel : null
    );
    if (!guidedLevel) return null;
    patch.guidedLevel = guidedLevel;
  }
  if (payload.displayOrder !== undefined) {
    patch.displayOrder =
      typeof payload.displayOrder === "number" && Number.isFinite(payload.displayOrder)
        ? payload.displayOrder
        : null;
  }
  if (payload.supportsPortrait !== undefined) patch.supportsPortrait = Boolean(payload.supportsPortrait);
  if (payload.supportsLandscape !== undefined) patch.supportsLandscape = Boolean(payload.supportsLandscape);
  if (payload.supportsReflowMode !== undefined) patch.supportsReflowMode = Boolean(payload.supportsReflowMode);
  if (payload.supportsPdfExport !== undefined) patch.supportsPdfExport = Boolean(payload.supportsPdfExport);
  if (payload.questionsByChapter !== undefined) {
    if (
      typeof payload.questionsByChapter !== "object" ||
      payload.questionsByChapter === null ||
      Array.isArray(payload.questionsByChapter)
    ) {
      return null;
    }

    const questionsByChapter: Record<string, AdminTemplateQuestion[]> = {};
    for (const [chapterKey, value] of Object.entries(payload.questionsByChapter as Record<string, unknown>)) {
      if (!Array.isArray(value)) return null;
      const parsedQuestions: AdminTemplateQuestion[] = [];
      for (const question of value) {
        if (typeof question !== "object" || question === null || Array.isArray(question)) {
          return null;
        }
        const entry = question as Record<string, unknown>;
        if (
          typeof entry.questionId !== "string" ||
          typeof entry.prompt !== "string" ||
          typeof entry.required !== "boolean"
        ) {
          return null;
        }
        const inputType =
          entry.inputType === "text" || entry.inputType === "textarea" || entry.inputType === null || entry.inputType === undefined
            ? (entry.inputType ?? null)
            : "__invalid__";
        if (inputType === "__invalid__") return null;
        if (
          entry.helpText !== undefined &&
          entry.helpText !== null &&
          typeof entry.helpText !== "string"
        ) {
          return null;
        }
        if (
          entry.slotKey !== undefined &&
          entry.slotKey !== null &&
          typeof entry.slotKey !== "string"
        ) {
          return null;
        }

        parsedQuestions.push({
          questionId: entry.questionId,
          prompt: entry.prompt,
          helpText: typeof entry.helpText === "string" ? entry.helpText : null,
          required: entry.required,
          inputType: (inputType as "text" | "textarea" | null),
          slotKey: typeof entry.slotKey === "string" ? entry.slotKey : null,
        });
      }
      questionsByChapter[chapterKey] = parsedQuestions;
    }
    patch.questionsByChapter = questionsByChapter;
  }

  return patch;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("templates.view");
  if (!ctx) return FORBIDDEN;

  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);
  const template = await getAdminTemplateDetail(templateId);

  if (!template) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Template not found." } },
      { status: 404 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_viewed",
    resourceType: "template",
    resourceId: templateId,
    action: "view",
  });

  return NextResponse.json({ success: true, data: { template } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const ctx = await requireAdminPermissionForApi("templates.manage");
  if (!ctx) return FORBIDDEN;

  const body = parseTemplatePatchBody(await request.json().catch(() => null));
  if (!body) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Template patch is invalid." } },
      { status: 400 }
    );
  }

  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);
  const result = await updateAdminTemplate(templateId, body);

  if (!result.ok || !result.data.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.ok ? result.data.code ?? "TEMPLATE_UPDATE_FAILED" : "TEMPLATE_UPDATE_FAILED",
          message: result.ok ? result.data.errors?.[0] ?? "Template could not be updated." : result.error,
        },
      },
      { status: result.ok && result.data.code === "NOT_FOUND" ? 404 : 400 }
    );
  }

  void writeAuditLog({
    adminUserId: ctx.adminId,
    actorUserId: ctx.userId,
    eventType: "admin_template_updated",
    resourceType: "template",
    resourceId: templateId,
    action: "update",
    metadataJson: body,
  });

  return NextResponse.json({ success: true });
}
