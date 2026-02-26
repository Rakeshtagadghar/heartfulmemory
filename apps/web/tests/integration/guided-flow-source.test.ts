import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "..", "..");

function readRepoFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Sprint 17 guided flow Convex source contracts", () => {
  it("storybooks.createGuided includes idempotency and chapter instantiation branches", () => {
    const source = readRepoFile("convex/storybooks.ts");

    expect(source).toContain("export const createGuided");
    expect(source).toContain("by_ownerId_guidedClientRequestId");
    expect(source).toContain("instantiateGuidedChaptersFromTemplate");
    expect(source).toContain("createDefaultGuidedChapter");
  });

  it("chapterAnswers.upsert upserts on (chapterInstanceId, questionId) and increments version", () => {
    const source = readRepoFile("convex/chapterAnswers.ts");

    expect(source).toContain("export const upsert");
    expect(source).toContain("by_chapterInstanceId_questionId");
    expect(source).toContain(".eq(\"questionId\", args.questionId)");
    expect(source).toContain("version: existing.version + 1");
  });
});

