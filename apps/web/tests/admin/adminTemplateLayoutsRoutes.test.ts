import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminPermissionForApiMock = vi.fn();
const getAdminTemplateLayoutsMock = vi.fn();
const updateAdminTemplateLayoutsMock = vi.fn();
const validateAdminTemplateLayoutsMock = vi.fn();
const writeAuditLogMock = vi.fn();

vi.mock("../../lib/admin/requireAdmin", () => ({
  requireAdminPermissionForApi: (...args: unknown[]) => requireAdminPermissionForApiMock(...args),
}));

vi.mock("../../lib/admin/adminOps", () => ({
  getAdminTemplateLayouts: (...args: unknown[]) => getAdminTemplateLayoutsMock(...args),
  updateAdminTemplateLayouts: (...args: unknown[]) => updateAdminTemplateLayoutsMock(...args),
  validateAdminTemplateLayouts: (...args: unknown[]) => validateAdminTemplateLayoutsMock(...args),
  writeAuditLog: (...args: unknown[]) => writeAuditLogMock(...args),
}));

function adminContext(permission: string) {
  return {
    adminId: "admin_1",
    userId: "user_admin",
    role: "content_admin",
    permissions: [permission],
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
            x: 80,
            y: 96,
            w: 1040,
            h: 140,
            zIndex: 1,
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

describe("admin template layout routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns forbidden for layout GET without permission", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(null);

    const { GET } = await import("../../app/api/admin/templates/[templateId]/layouts/route");
    const response = await GET(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/layouts"),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );

    expect(response.status).toBe(403);
  });

  it("returns template layouts for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.view"));
    getAdminTemplateLayoutsMock.mockResolvedValue({
      templateId: "tpl_1",
      layoutDefinition: buildLayoutDefinition(),
      validation: { ok: true, errors: [] },
    });

    const { GET } = await import("../../app/api/admin/templates/[templateId]/layouts/route");
    const response = await GET(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/layouts"),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as {
      success: boolean;
      data: { templateId: string };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.templateId).toBe("tpl_1");
    expect(getAdminTemplateLayoutsMock).toHaveBeenCalledWith("tpl_1");
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_template_layouts_viewed",
        resourceType: "template",
        resourceId: "tpl_1",
      })
    );
  });

  it("updates template layouts for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.manage"));
    updateAdminTemplateLayoutsMock.mockResolvedValue({
      ok: true,
      data: {
        ok: true,
        validation: { ok: true, errors: [] },
      },
    });

    const { PATCH } = await import("../../app/api/admin/templates/[templateId]/layouts/route");
    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/layouts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ layoutDefinition: buildLayoutDefinition() }),
      }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as {
      success: boolean;
      data: { validation: { ok: boolean } | null };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.validation?.ok).toBe(true);
    expect(updateAdminTemplateLayoutsMock).toHaveBeenCalledWith(
      "tpl_1",
      expect.objectContaining({
        layoutSchemaVersion: 1,
        pageLayouts: expect.any(Array),
      })
    );
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_template_layouts_updated",
        resourceId: "tpl_1",
      })
    );
  });

  it("rejects invalid layout PATCH payloads", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.manage"));

    const { PATCH } = await import("../../app/api/admin/templates/[templateId]/layouts/route");
    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/layouts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageLayouts: "bad" }),
      }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as { success: boolean; error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(updateAdminTemplateLayoutsMock).not.toHaveBeenCalled();
  });

  it("rejects invalid top-level layout validate payloads", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.manage"));

    const { POST } = await import("../../app/api/admin/templates/[templateId]/layouts/validate/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/layouts/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageLayouts: "bad" }),
      }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as { success: boolean; error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(validateAdminTemplateLayoutsMock).not.toHaveBeenCalled();
  });

  it("validates stored template layouts when no payload is provided", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.manage"));
    validateAdminTemplateLayoutsMock.mockResolvedValue({
      ok: true,
      data: {
        ok: true,
        validation: { ok: true, errors: [] },
        errors: [],
      },
    });

    const { POST } = await import("../../app/api/admin/templates/[templateId]/layouts/validate/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/layouts/validate", {
        method: "POST",
      }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as {
      success: boolean;
      data: { ok: boolean; validation: { ok: boolean } };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.ok).toBe(true);
    expect(validateAdminTemplateLayoutsMock).toHaveBeenCalledWith("tpl_1", undefined);
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_template_layouts_validated",
        resourceId: "tpl_1",
      })
    );
  });
});
