import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "..", "..");

function readRepoFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Sprint 22 draft quality v2 source contracts", () => {
  it("adds v2 generation actions with prompt/validator wiring", () => {
    const aiV2 = readRepoFile("convex/ai/chapterDrafts_v2.ts");
    expect(aiV2).toContain("export const generateV2 = action");
    expect(aiV2).toContain("export const regenSectionV2 = action");
    expect(aiV2).toContain("buildChapterDraftPromptV2");
    expect(aiV2).toContain("validateDraftOutputV1");
    expect(aiV2).toContain("api.chapterDrafts.setReady");
    expect(aiV2).toContain("api.chapterDrafts.setError");
    expect(aiV2).toContain("guidance: targetSection.guidance");
  });

  it("persists guidance separately from visible text in chapter drafts", () => {
    const schema = readRepoFile("convex/schema.ts");
    const drafts = readRepoFile("convex/chapterDrafts.ts");
    expect(schema).toContain("guidance: v.optional(v.string())");
    expect(drafts).toContain("normalizeSections(chapterKey");
    expect(drafts).toContain("guidanceMap.get(section.sectionId)");
    expect(drafts).toContain("sections: normalizeSections(draft.chapterKey");
  });

  it("routes Draft UI generation requests through Sprint 22 v2 actions", () => {
    const createFlow = readRepoFile("apps/web/lib/data/create-flow.ts");
    expect(createFlow).toContain("ai/chapterDrafts_v2");
    expect(createFlow).toContain("generateV2");
    expect(createFlow).toContain("regenSectionV2");
  });
});

