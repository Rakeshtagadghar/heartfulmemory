import { describe, expect, it } from "vitest";
import {
  buildAdminFailureSummary,
  classifyAdminExportFailure,
  createAdminExportRecordId,
  getAdminRetryEligibility,
  normalizeAdminExportStatus,
  parseAdminExportRecordId,
} from "../../../../packages/shared/admin/exportMonitoring";

describe("admin export monitoring helpers", () => {
  it("normalizes raw export statuses into admin-facing statuses", () => {
    expect(normalizeAdminExportStatus("queued")).toBe("queued");
    expect(normalizeAdminExportStatus("running")).toBe("processing");
    expect(normalizeAdminExportStatus("done")).toBe("succeeded");
    expect(normalizeAdminExportStatus("FAILED")).toBe("failed");
  });

  it("classifies validation and timeout failures", () => {
    expect(
      classifyAdminExportFailure({
        status: "failed",
        errorCode: "EXPORT_VALIDATION_FAILED",
        errorMessage: "Layout validation failed for one page.",
      })
    ).toBe("validation_error");

    expect(
      classifyAdminExportFailure({
        status: "failed",
        errorCode: "GENERATION_FAILED",
        errorMessage: "Renderer timed out while building the PDF.",
      })
    ).toBe("timeout");
  });

  it("prefers safe raw summaries only when allowed", () => {
    expect(
      buildAdminFailureSummary({
        category: "renderer_error",
        rawMessage: "Renderer crashed on page 6.",
        includeRawMessage: true,
      })
    ).toBe("Renderer crashed on page 6.");

    expect(
      buildAdminFailureSummary({
        category: "renderer_error",
        rawMessage: "Renderer crashed on page 6.",
        includeRawMessage: false,
      })
    ).toContain("renderer failed");
  });

  it("blocks retry for in-progress and validation failures", () => {
    expect(
      getAdminRetryEligibility({
        status: "processing",
        failureCategory: null,
        latestProjectExportInProgress: true,
        currentJobIsLatest: true,
      })
    ).toMatchObject({
      eligible: false,
      reasonCode: "job_in_progress",
    });

    expect(
      getAdminRetryEligibility({
        status: "failed",
        failureCategory: "validation_error",
        latestProjectExportInProgress: false,
        currentJobIsLatest: true,
      })
    ).toMatchObject({
      eligible: false,
      reasonCode: "validation_error",
    });
  });

  it("creates and parses opaque admin export ids", () => {
    const id = createAdminExportRecordId("attempt", "abc123");
    expect(id).toBe("attempt_abc123");
    expect(parseAdminExportRecordId(id)).toEqual({
      source: "attempt",
      sourceId: "abc123",
    });
  });
});
