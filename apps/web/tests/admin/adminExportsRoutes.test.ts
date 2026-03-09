import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminPermissionForApiMock = vi.fn();
const listAdminExportJobsMock = vi.fn();
const getAdminExportJobDetailMock = vi.fn();
const writeAuditLogMock = vi.fn();
const convexMutationMock = vi.fn();
const runPdfExportMock = vi.fn();
const runDocxExportMock = vi.fn();
const runPptxExportMock = vi.fn();

vi.mock("../../lib/admin/requireAdmin", () => ({
  requireAdminPermissionForApi: (...args: unknown[]) => requireAdminPermissionForApiMock(...args),
}));

vi.mock("../../lib/admin/adminOps", () => ({
  listAdminExportJobs: (...args: unknown[]) => listAdminExportJobsMock(...args),
  getAdminExportJobDetail: (...args: unknown[]) => getAdminExportJobDetailMock(...args),
  writeAuditLog: (...args: unknown[]) => writeAuditLogMock(...args),
}));

vi.mock("../../lib/convex/ops", () => ({
  anyApi: {
    exportJobs: {
      createAdminRetryJob: "mock:createAdminRetryJob",
    },
  },
  convexMutation: (...args: unknown[]) => convexMutationMock(...args),
}));

vi.mock("../../app/api/export/pdf/route", () => ({
  runPdfExport: (...args: unknown[]) => runPdfExportMock(...args),
}));

vi.mock("../../lib/export/runDocxExport", () => ({
  runDocxExport: (...args: unknown[]) => runDocxExportMock(...args),
}));

vi.mock("../../lib/export/runPptxExport", () => ({
  runPptxExport: (...args: unknown[]) => runPptxExportMock(...args),
}));

describe("admin exports routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns forbidden for exports list without permission", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue(null);

    const { GET } = await import("../../app/api/admin/exports/route");
    const response = await GET(new Request("http://localhost:3000/api/admin/exports"));
    const body = (await response.json()) as { success: boolean; error: { code: string } };

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("blocks retry when eligibility is false", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue({
      adminId: "admin_1",
      userId: "user_admin",
      role: "support_admin",
      permissions: ["exports.retry"],
      email: "admin@example.com",
    });
    getAdminExportJobDetailMock.mockResolvedValue({
      id: "attempt_export_1",
      source: "attempt",
      sourceRecordId: "export_1",
      ownerId: "owner_1",
      projectId: "storybook_1",
      projectTitle: "Book",
      format: "pdf",
      exportTarget: "DIGITAL_PDF",
      status: "failed",
      retryEligibility: {
        eligible: false,
        caution: false,
        reasonCode: "validation_error",
        blockReason: "Validation failures usually require content changes before retry.",
      },
    });

    const { POST } = await import("../../app/api/admin/exports/[exportId]/retry/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/exports/attempt_export_1/retry", {
        method: "POST",
      }),
      { params: Promise.resolve({ exportId: "attempt_export_1" }) }
    );
    const body = (await response.json()) as { success: boolean; error: { code: string } };

    expect(response.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RETRY_NOT_ALLOWED");
    expect(convexMutationMock).not.toHaveBeenCalled();
  });

  it("creates and executes a pdf retry job", async () => {
    requireAdminPermissionForApiMock.mockResolvedValue({
      adminId: "admin_1",
      userId: "user_admin",
      role: "support_admin",
      permissions: ["exports.retry"],
      email: "admin@example.com",
    });
    getAdminExportJobDetailMock.mockResolvedValue({
      id: "attempt_export_1",
      source: "attempt",
      sourceRecordId: "export_1",
      ownerId: "owner_1",
      projectId: "storybook_1",
      projectTitle: "Book",
      format: "pdf",
      exportTarget: "DIGITAL_PDF",
      status: "failed",
      jobId: null,
      retryEligibility: {
        eligible: true,
        caution: false,
        reasonCode: null,
        blockReason: null,
      },
    });
    convexMutationMock.mockResolvedValue({
      ok: true,
      data: { ok: true, jobId: "job_retry_1" },
    });
    runPdfExportMock.mockResolvedValue({
      ok: true,
      jobId: "job_retry_1",
      response: new Response(null, { status: 200 }),
    });

    const { POST } = await import("../../app/api/admin/exports/[exportId]/retry/route");
    const response = await POST(
      new Request("http://localhost:3000/api/admin/exports/attempt_export_1/retry", {
        method: "POST",
      }),
      { params: Promise.resolve({ exportId: "attempt_export_1" }) }
    );
    const body = (await response.json()) as {
      success: boolean;
      data: { newJobId: string; status: string };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.newJobId).toBe("job_retry_1");
    expect(runPdfExportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        viewerSubject: "owner_1",
        bypassBillingGuard: true,
        bypassRateLimit: true,
        skipUsageIncrement: true,
        trackedJob: {
          jobId: "job_retry_1",
          forceExportHash: "job_retry_1",
        },
      })
    );
  });
});
