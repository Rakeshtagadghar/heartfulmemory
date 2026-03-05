import { describe, expect, it } from "vitest";
import {
  buildExportArtifactKey,
  getExportMimeType,
  getExportExtension,
} from "../../lib/r2/putExportArtifact";

describe("R2 artifact keys", () => {
  it("builds DOCX key correctly", () => {
    const key = buildExportArtifactKey({
      storybookId: "sb-123",
      type: "docx",
      jobId: "job-456",
    });
    expect(key).toBe("exports/sb-123/docx/job-456.docx");
  });

  it("builds PPTX key correctly", () => {
    const key = buildExportArtifactKey({
      storybookId: "sb-123",
      type: "pptx",
      jobId: "job-789",
    });
    expect(key).toBe("exports/sb-123/pptx/job-789.pptx");
  });

  it("builds PDF key correctly", () => {
    const key = buildExportArtifactKey({
      storybookId: "sb-123",
      type: "pdf",
      jobId: "job-001",
    });
    expect(key).toBe("exports/sb-123/pdf/job-001.pdf");
  });

  it("returns correct MIME type for DOCX", () => {
    expect(getExportMimeType("docx")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  });

  it("returns correct MIME type for PPTX", () => {
    expect(getExportMimeType("pptx")).toBe(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
  });

  it("returns correct MIME type for PDF", () => {
    expect(getExportMimeType("pdf")).toBe("application/pdf");
  });

  it("returns correct extension for each type", () => {
    expect(getExportExtension("docx")).toBe("docx");
    expect(getExportExtension("pptx")).toBe("pptx");
    expect(getExportExtension("pdf")).toBe("pdf");
  });
});
