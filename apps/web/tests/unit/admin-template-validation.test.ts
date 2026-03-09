import { describe, expect, it } from "vitest";
import {
  normalizeAdminTemplateCompatibilityFilter,
  templateMatchesCompatibilityFilter,
  validateAdminTemplateMetadataInput,
  validateAdminTemplatePublishability,
} from "../../../../packages/shared/admin/templates";

describe("validateAdminTemplatePublishability", () => {
  it("accepts a publishable template", () => {
    const result = validateAdminTemplatePublishability({
      slug: "family_roots",
      name: "Family Roots",
      type: "book_template",
      visibility: "public",
      compatibility: {
        supportsPortrait: true,
        supportsLandscape: false,
        supportsPdfExport: true,
      },
      chapterCount: 4,
      questionCount: 12,
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("blocks publication for incomplete metadata and compatibility", () => {
    const result = validateAdminTemplatePublishability({
      slug: "",
      name: "",
      type: "book_template",
      visibility: "public",
      compatibility: {
        supportsPortrait: false,
        supportsLandscape: false,
        supportsPdfExport: false,
      },
      chapterCount: 0,
      questionCount: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Slug is required before publication.");
    expect(result.errors).toContain("Template name is required before publication.");
    expect(result.errors).toContain("PDF export support must be confirmed before publication.");
    expect(result.errors).toContain("At least one supported orientation must be declared before publication.");
    expect(result.errors).toContain("At least one chapter is required before publication.");
    expect(result.errors).toContain("At least one guided prompt is required before publication.");
  });
});

describe("validateAdminTemplateMetadataInput", () => {
  it("rejects invalid display order", () => {
    const result = validateAdminTemplateMetadataInput({
      name: "Template",
      displayOrder: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Display order must be a positive integer when provided.");
  });
});

describe("templateMatchesCompatibilityFilter", () => {
  const configured = {
    supportsPortrait: true,
    supportsLandscape: true,
    supportsReflowMode: true,
    supportsPdfExport: true,
  };

  const incomplete = {
    supportsPortrait: true,
    supportsLandscape: null,
    supportsReflowMode: false,
    supportsPdfExport: false,
  };

  it("normalizes compatibility filter values", () => {
    expect(normalizeAdminTemplateCompatibilityFilter("fully_configured")).toBe("fully_configured");
    expect(normalizeAdminTemplateCompatibilityFilter("bad_value")).toBeNull();
  });

  it("matches fully configured templates", () => {
    expect(templateMatchesCompatibilityFilter(configured, "fully_configured")).toBe(true);
    expect(templateMatchesCompatibilityFilter(incomplete, "fully_configured")).toBe(false);
  });

  it("matches templates needing compatibility attention", () => {
    expect(templateMatchesCompatibilityFilter(configured, "needs_attention")).toBe(false);
    expect(templateMatchesCompatibilityFilter(incomplete, "needs_attention")).toBe(true);
  });
});
