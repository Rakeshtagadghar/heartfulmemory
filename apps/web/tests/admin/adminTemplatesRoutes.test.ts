import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminPermissionForApiMock = vi.fn();
const listAdminTemplatesMock = vi.fn();
const getAdminTemplateDetailMock = vi.fn();
const createAdminTemplateMock = vi.fn();
const updateAdminTemplateMock = vi.fn();
const publishAdminTemplateMock = vi.fn();
const disableAdminTemplateMock = vi.fn();
const archiveAdminTemplateMock = vi.fn();
const setAdminTemplateDefaultMock = vi.fn();
const reorderAdminTemplatesMock = vi.fn();
const writeAuditLogMock = vi.fn();

vi.mock("../../lib/admin/requireAdmin", () => ({
  requireAdminPermissionForApi: (...args: unknown[]) => requireAdminPermissionForApiMock(...args),
}));

vi.mock("../../lib/admin/adminOps", () => ({
  listAdminTemplates: (...args: unknown[]) => listAdminTemplatesMock(...args),
  getAdminTemplateDetail: (...args: unknown[]) => getAdminTemplateDetailMock(...args),
  createAdminTemplate: (...args: unknown[]) => createAdminTemplateMock(...args),
  updateAdminTemplate: (...args: unknown[]) => updateAdminTemplateMock(...args),
  publishAdminTemplate: (...args: unknown[]) => publishAdminTemplateMock(...args),
  disableAdminTemplate: (...args: unknown[]) => disableAdminTemplateMock(...args),
  archiveAdminTemplate: (...args: unknown[]) => archiveAdminTemplateMock(...args),
  setAdminTemplateDefault: (...args: unknown[]) => setAdminTemplateDefaultMock(...args),
  reorderAdminTemplates: (...args: unknown[]) => reorderAdminTemplatesMock(...args),
  writeAuditLog: (...args: unknown[]) => writeAuditLogMock(...args),
}));

function adminContext(permission: string, role = "content_admin") {
  return {
    adminId: "admin_1",
    userId: "user_admin",
    role,
    permissions: [permission],
    email: "admin@example.com",
  };
}

describe("admin template routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns forbidden for template list without permission", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(null);

    const { GET } = await import("../../app/api/admin/templates/route");
    const response = await GET(new Request("http://localhost:3000/api/admin/templates"));
    const body = (await response.json()) as { success: boolean; error: { code: string } };

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns filtered template catalog for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.view"));
    listAdminTemplatesMock.mockResolvedValue({
      items: [
        {
          id: "tpl_1",
          slug: "tpl_1",
          name: "Childhood & Roots",
          description: "Guided family origin stories.",
          type: "book_template",
          status: "published",
          visibility: "public",
          category: "childhood",
          guidedLevel: "guided",
          isDefault: false,
          displayOrder: 1,
          usageCount: 4,
          chapterCount: 3,
          questionCount: 9,
          compatibilityStatus: "configured",
          updatedAt: 100,
        },
      ],
      summary: {
        total: 1,
        published: 1,
        disabled: 0,
        inUse: 1,
      },
      pagination: {
        page: 1,
        pageSize: 25,
        total: 1,
      },
    });

    const { GET } = await import("../../app/api/admin/templates/route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/admin/templates?q=child&status=published&type=book_template&visibility=public&category=childhood&guidedLevel=guided&compatibility=fully_configured&page=1"
      )
    );
    const body = (await response.json()) as {
      success: boolean;
      data: { summary: { published: number } };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.summary.published).toBe(1);
    expect(listAdminTemplatesMock).toHaveBeenCalledWith({
      q: "child",
      status: "published",
      type: "book_template",
      visibility: "public",
      category: "childhood",
      guidedLevel: "guided",
      compatibility: "fully_configured",
      page: 1,
      pageSize: 25,
    });
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_templates_viewed",
        resourceType: "template_catalog",
      })
    );
  });

  it("returns template detail for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.view", "support_admin"));
    getAdminTemplateDetailMock.mockResolvedValue({
      id: "tpl_1",
      slug: "tpl_1",
      name: "Childhood & Roots",
      description: "Guided family origin stories.",
      subtitle: "Guided family origin stories.",
      type: "book_template",
      status: "published",
      visibility: "public",
      category: "childhood",
      guidedLevel: "guided",
      isDefault: false,
      displayOrder: 1,
      usageCount: 4,
      chapterCount: 3,
      questionCount: 9,
      compatibilityStatus: "configured",
      updatedAt: 100,
      createdAt: 100,
      source: "seed",
      compatibility: {
        supportsPortrait: true,
        supportsLandscape: null,
        supportsReflowMode: null,
        supportsPdfExport: true,
        warnings: [],
      },
      usageSummary: {
        totalStorybooks: 4,
        activeStorybooks: 2,
        canArchiveSafely: false,
        warnings: [],
      },
      actionState: {
        canPublish: false,
        publishErrors: [],
        canDisable: true,
        canArchive: false,
        archiveBlockReason: "Disable first.",
        canSetDefault: true,
      },
      chapters: [
        {
          chapterKey: "ch_1",
          title: "Origins",
          subtitle: null,
          questionCount: 1,
          questions: [
            {
              questionId: "q_1",
              prompt: "Where did it begin?",
              helpText: null,
              required: true,
              inputType: "textarea",
              slotKey: "origins.begin",
            },
          ],
        },
      ],
      recentStorybooks: [],
    });

    const { GET } = await import("../../app/api/admin/templates/[templateId]/route");
    const response = await GET(
      new Request("http://localhost:3000/api/admin/templates/tpl_1"),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as {
      success: boolean;
      data: { template: { id: string } };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.template.id).toBe("tpl_1");
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_template_viewed",
        resourceType: "template",
        resourceId: "tpl_1",
      })
    );
  });

  it("creates template metadata for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.manage"));
    createAdminTemplateMock.mockResolvedValue({
      ok: true,
      data: { ok: true, templateId: "new_template" },
    });

    const { POST } = await import("../../app/api/admin/templates/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: "new_template",
          name: "New Template",
          description: "Draft template",
          type: "book_template",
          visibility: "public",
          category: "general",
          guidedLevel: "guided",
          displayOrder: null,
          supportsPortrait: true,
          supportsLandscape: false,
          supportsReflowMode: false,
          supportsPdfExport: true,
        }),
      })
    );
    const body = (await response.json()) as {
      success: boolean;
      data: { templateId: string };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.templateId).toBe("new_template");
    expect(createAdminTemplateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "new_template",
        name: "New Template",
      })
    );
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_template_created",
        resourceType: "template",
        resourceId: "new_template",
      })
    );
  });

  it("updates template metadata for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.manage"));
    updateAdminTemplateMock.mockResolvedValue({
      ok: true,
      data: { ok: true },
    });

    const { PATCH } = await import("../../app/api/admin/templates/[templateId]/route");
    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/templates/tpl_1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Updated Template",
          category: "family_story",
          supportsLandscape: true,
        }),
      }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as { success: boolean };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateAdminTemplateMock).toHaveBeenCalledWith("tpl_1", {
      name: "Updated Template",
      category: "family_story",
      supportsLandscape: true,
    });
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_template_updated",
        resourceType: "template",
        resourceId: "tpl_1",
      })
    );
  });

  it("updates template questions for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.manage"));
    updateAdminTemplateMock.mockResolvedValue({
      ok: true,
      data: { ok: true },
    });

    const { PATCH } = await import("../../app/api/admin/templates/[templateId]/route");
    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/templates/tpl_1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          questionsByChapter: {
            ch_1: [
              {
                questionId: "q_1",
                prompt: "Where did it begin?",
                helpText: "Add names and places.",
                required: true,
                inputType: "textarea",
                slotKey: "origins.begin",
              },
              {
                questionId: "q_2",
                prompt: "Who was there?",
                helpText: null,
                required: false,
                inputType: "text",
                slotKey: "origins.people",
              },
            ],
          },
        }),
      }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as { success: boolean };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateAdminTemplateMock).toHaveBeenCalledWith("tpl_1", {
      questionsByChapter: {
        ch_1: [
          {
            questionId: "q_1",
            prompt: "Where did it begin?",
            helpText: "Add names and places.",
            required: true,
            inputType: "textarea",
            slotKey: "origins.begin",
          },
          {
            questionId: "q_2",
            prompt: "Who was there?",
            helpText: null,
            required: false,
            inputType: "text",
            slotKey: "origins.people",
          },
        ],
      },
    });
  });

  it("returns forbidden for publish without permission", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(null);

    const { POST } = await import("../../app/api/admin/templates/[templateId]/publish/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/publish", { method: "POST" }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );

    expect(response.status).toBe(403);
  });

  it("publishes a template for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.publish"));
    publishAdminTemplateMock.mockResolvedValue({
      ok: true,
      data: { ok: true },
    });

    const { POST } = await import("../../app/api/admin/templates/[templateId]/publish/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/publish", { method: "POST" }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );
    const body = (await response.json()) as { success: boolean; message: string };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Template published.");
    expect(publishAdminTemplateMock).toHaveBeenCalledWith("tpl_1");
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_template_published",
        resourceId: "tpl_1",
      })
    );
  });

  it("disables a template for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.publish"));
    disableAdminTemplateMock.mockResolvedValue({
      ok: true,
      data: { ok: true },
    });

    const { POST } = await import("../../app/api/admin/templates/[templateId]/disable/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/disable", { method: "POST" }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );

    expect(response.status).toBe(200);
    expect(disableAdminTemplateMock).toHaveBeenCalledWith("tpl_1");
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_template_disabled",
        resourceId: "tpl_1",
      })
    );
  });

  it("archives a template for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.archive"));
    archiveAdminTemplateMock.mockResolvedValue({
      ok: true,
      data: { ok: true },
    });

    const { POST } = await import("../../app/api/admin/templates/[templateId]/archive/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/archive", { method: "POST" }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );

    expect(response.status).toBe(200);
    expect(archiveAdminTemplateMock).toHaveBeenCalledWith("tpl_1");
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_template_archived",
        resourceId: "tpl_1",
      })
    );
  });

  it("sets a template as default for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.manage"));
    setAdminTemplateDefaultMock.mockResolvedValue({
      ok: true,
      data: { ok: true },
    });

    const { POST } = await import("../../app/api/admin/templates/[templateId]/set-default/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates/tpl_1/set-default", { method: "POST" }),
      { params: Promise.resolve({ templateId: "tpl_1" }) }
    );

    expect(response.status).toBe(200);
    expect(setAdminTemplateDefaultMock).toHaveBeenCalledWith("tpl_1");
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_template_default_changed",
        resourceId: "tpl_1",
      })
    );
  });

  it("rejects invalid reorder payloads", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.reorder"));

    const { POST } = await import("../../app/api/admin/templates/reorder/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: [{ templateId: "tpl_1" }] }),
      })
    );
    const body = (await response.json()) as { success: boolean; error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("reorders templates for an authorized admin", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(adminContext("templates.reorder"));
    reorderAdminTemplatesMock.mockResolvedValue({
      ok: true,
      data: { ok: true, count: 2 },
    });

    const { POST } = await import("../../app/api/admin/templates/reorder/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/templates/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: [
            { templateId: "tpl_1", displayOrder: 1 },
            { templateId: "tpl_2", displayOrder: 2 },
          ],
        }),
      })
    );
    const body = (await response.json()) as { success: boolean; message: string };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(reorderAdminTemplatesMock).toHaveBeenCalledWith([
      { templateId: "tpl_1", displayOrder: 1 },
      { templateId: "tpl_2", displayOrder: 2 },
    ]);
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "admin_template_reordered",
        resourceType: "template_catalog",
      })
    );
  });
});
