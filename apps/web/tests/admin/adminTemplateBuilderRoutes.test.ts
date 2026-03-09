import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminPermissionForApiMock = vi.fn();
const getAdminTemplateDetailMock = vi.fn();
const getAdminTemplateLayoutsMock = vi.fn();
const updateAdminTemplateLayoutsMock = vi.fn();
const validateAdminTemplateLayoutsMock = vi.fn();
const writeAuditLogMock = vi.fn();

vi.mock("../../lib/admin/requireAdmin", () => ({
  requireAdminPermissionForApi: (...args: unknown[]) => requireAdminPermissionForApiMock(...args),
}));

vi.mock("../../lib/admin/adminOps", () => ({
  getAdminTemplateDetail: (...args: unknown[]) => getAdminTemplateDetailMock(...args),
  getAdminTemplateLayouts: (...args: unknown[]) => getAdminTemplateLayoutsMock(...args),
  updateAdminTemplateLayouts: (...args: unknown[]) => updateAdminTemplateLayoutsMock(...args),
  validateAdminTemplateLayouts: (...args: unknown[]) => validateAdminTemplateLayoutsMock(...args),
  writeAuditLog: (...args: unknown[]) => writeAuditLogMock(...args),
}));

function adminContext(permission: string) {
  return {
    adminId: "admin_1",
    userId: "user_admin",
    role: permission === "templates.view" ? "support_admin" : "content_admin",
    permissions: [permission, "templates.view", "templates.manage"],
    email: "admin@example.com",
  };
}

function buildLayoutDefinition() {
  return {
    layoutSchemaVersion: 1,
    pageLayouts: [
      {
        pageLayoutId: "chapter_main_v1",
        name: "Chapter Main",
        pageRole: "story_page",
        sizePreset: "BOOK_8_5X11",
        supportedOrientations: ["portrait"],
        slots: [
          {
            slotId: "title",
            kind: "text",
            role: "title",
            bindingKey: "chapterTitle",
            x: 60,
            y: 64,
            w: 696,
            h: 72,
            zIndex: 1,
            overflowBehavior: "shrink_to_fit",
          },
          {
            slotId: "image1",
            kind: "image",
            role: "image",
            bindingKey: "primaryImage",
            x: 60,
            y: 156,
            w: 470,
            h: 320,
            zIndex: 2,
            imageFit: "cover",
          },
        ],
      },
    ],
    chapterPagePlans: [
      {
        chapterKey: "ch_1",
        pages: [{ pageLayoutId: "chapter_main_v1", pageRole: "story_page" }],
      },
    ],
  };
}

describe("admin template builder routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminTemplateDetailMock.mockResolvedValue({
      id: "tpl_1",
      name: "Template One",
      status: "draft",
      updatedAt: 123,
    });
    getAdminTemplateLayoutsMock.mockResolvedValue({
      templateId: "tpl_1",
      layoutDefinition: buildLayoutDefinition(),
      validation: { ok: true, errors: [] },
    });
  });

  it("returns builder load data for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.view"));

    const { GET } = await import("../../app/api/admin/templates/[templateId]/layout-builder/route");
    const response = await GET(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/layout-builder"),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as {
      success: boolean;
      data: { templateId: string; selectedLayoutId: string | null };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.templateId).toBe("tpl_1");
    expect(body.data.selectedLayoutId).toBe("chapter_main_v1");
  });

  it("saves builder draft changes for templates.manage", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.manage"));
    updateAdminTemplateLayoutsMock.mockResolvedValue({
      ok: true,
      data: { ok: true, validation: { ok: true, errors: [] } },
    });

    const { PATCH } = await import("../../app/api/admin/templates/[templateId]/layout-builder/route");
    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/layout-builder", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ layoutDefinition: buildLayoutDefinition() }),
      }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as { success: boolean; data: { layoutDefinition: { pageLayouts: unknown[] } } };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.layoutDefinition.pageLayouts).toHaveLength(1);
    expect(updateAdminTemplateLayoutsMock).toHaveBeenCalledWith("tpl_1", expect.objectContaining({
      layoutSchemaVersion: 1,
    }));
  });

  it("validates builder payloads", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.manage"));
    validateAdminTemplateLayoutsMock.mockResolvedValue({
      ok: true,
      data: { ok: true, validation: { ok: true, errors: [] }, errors: [] },
    });

    const { POST } = await import("../../app/api/admin/templates/[templateId]/layout-builder/validate/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/layout-builder/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ layoutDefinition: buildLayoutDefinition() }),
      }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as { success: boolean; data: { isValid: boolean } };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isValid).toBe(true);
  });

  it("returns preview data for templates.view", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.view"));

    const { POST } = await import("../../app/api/admin/templates/[templateId]/layout-builder/preview/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/layout-builder/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pageLayoutId: "chapter_main_v1",
          previewMode: "sample_content",
          layoutDefinition: buildLayoutDefinition(),
        }),
      }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as {
      success: boolean;
      data: { renderedPreviewRefOrData: { pageLayoutId: string } | null };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.renderedPreviewRefOrData?.pageLayoutId).toBe("chapter_main_v1");
    expect(writeAuditLogMock).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "admin_template_builder_preview_generated",
    }));
  });

  it("blocks builder save without manage permission", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(null);

    const { PATCH } = await import("../../app/api/admin/templates/[templateId]/layout-builder/route");
    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/layout-builder", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ layoutDefinition: buildLayoutDefinition() }),
      }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );

    expect(response.status).toBe(403);
  });
});
