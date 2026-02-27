import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "..", "..");

function readRepoFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Sprint 21 studio populate source contracts", () => {
  it("defines chapterStudioState persistence and owner-guarded studio docs access", () => {
    const schema = readRepoFile("convex/schema.ts");
    const chapterStudioState = readRepoFile("convex/chapterStudioState.ts");
    const studioDocs = readRepoFile("convex/studioDocs.ts");

    expect(schema).toContain("chapterStudioState: defineTable");
    expect(schema).toContain("by_chapterInstanceId");
    expect(chapterStudioState).toContain("export const upsertPopulationState");
    expect(chapterStudioState).toContain("export const markEdited");
    expect(chapterStudioState).toContain("export const markFinalized");
    expect(chapterStudioState).toContain("promoteStatus");
    expect(studioDocs).toContain("export const getByStorybook");
    expect(studioDocs).toContain("assertCanAccessStorybook");
    expect(studioDocs).toContain("export const save");
  });

  it("uses stable node keys + version refs for idempotent populateChapter reruns", () => {
    const populate = readRepoFile("convex/studioPopulate.ts");
    const contractTypes = readRepoFile("packages/shared/populate/populationTypes.ts");

    expect(populate).toContain("export const populateChapter = action");
    expect(populate).toContain("stableNodeKey(");
    expect(populate).toContain("const key = String(meta.stableNodeKey)");
    expect(populate).toContain("byStableKey");
    expect(populate).toContain("lastAppliedDraftVersion: draft.version");
    expect(populate).toContain("lastAppliedIllustrationVersion: illustrationState.version");
    expect(populate).toContain("api.chapterStudioState.upsertPopulationState");
    expect(populate).toContain("skippedBecauseEdited");
    expect(contractTypes).toContain("stableNodeIdStrategy: \"chapterKey:pageTemplateId:slotId\"");
    expect(contractTypes).toContain("overwritePolicy: \"skip_user_edited_nodes\"");
  });

  it("routes Studio entry through populate-or-reuse resolution and chapter pipeline fallback", () => {
    const openInStudio = readRepoFile("apps/web/lib/studio/openInStudio.ts");
    const nextStepRouter = readRepoFile("apps/web/lib/chapters/nextStepRouter.ts");

    expect(openInStudio).toContain("resolveOpenInStudioForUser");
    expect(openInStudio).toContain("populateStudioChapterForUser");
    expect(openInStudio).toContain("/wizard");
    expect(openInStudio).toContain("/draft");
    expect(openInStudio).toContain("/illustrations");
    expect(nextStepRouter).toContain("resolveNextChapterRoute");
    expect(nextStepRouter).toContain("kind: \"wizard\"");
    expect(nextStepRouter).toContain("kind: \"draft\"");
    expect(nextStepRouter).toContain("kind: \"illustrations\"");
    expect(nextStepRouter).toContain("kind: \"studio\"");
  });
});
