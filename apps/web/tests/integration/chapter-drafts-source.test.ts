import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "..", "..");

function readRepoFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Sprint 19 draft generation source contracts", () => {
  it("defines chapterDrafts schema + versioned draft mutations", () => {
    const schema = readRepoFile("convex/schema.ts");
    const drafts = readRepoFile("convex/chapterDrafts.ts");

    expect(schema).toContain("chapterDrafts: defineTable");
    expect(schema).toContain("by_chapterInstanceId_version");
    expect(drafts).toContain("export const beginVersion");
    expect(drafts).toContain("DRAFT_ALREADY_GENERATING");
    expect(drafts).toContain("nextVersionForChapter");
  });

  it("implements AI generate and regenSection actions with quality checks + version writes", () => {
    const aiActions = readRepoFile("convex/ai/chapterDrafts.ts");

    expect(aiActions).toContain("export const generate = action");
    expect(aiActions).toContain("export const regenSection = action");
    expect(aiActions).toContain("api.chapterDrafts.beginVersion");
    expect(aiActions).toContain("api.chapterDrafts.setReady");
    expect(aiActions).toContain("runDraftQualityChecks");
    expect(aiActions).toContain("mergeRegeneratedSection");
  });

  it("includes deterministic section framework and prompt contract", () => {
    const sections = readRepoFile("packages/shared/templates/sectionFramework.ts");
    const prompt = readRepoFile("lib/ai/prompts/chapterDraftPrompt.ts");

    expect(sections).toContain("getSectionFrameworkForChapterKey");
    expect(sections).toContain("teachers_friends");
    expect(prompt).toContain("Generate a grounded memoir chapter draft");
    expect(prompt).toContain("Do not add facts not present in answers");
  });
});
