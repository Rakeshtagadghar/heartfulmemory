import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "..", "..");

function readRepoFile(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Sprint 20 auto-illustrate source contracts", () => {
  it("defines schema + queries for mediaAssets and chapterIllustrations", () => {
    const schema = readRepoFile("convex/schema.ts");
    const illustrations = readRepoFile("convex/chapterIllustrations.ts");
    const mediaAssets = readRepoFile("convex/mediaAssets.ts");

    expect(schema).toContain("mediaAssets: defineTable");
    expect(schema).toContain("chapterIllustrations: defineTable");
    expect(schema).toContain("by_source_sourceId");
    expect(schema).toContain("by_chapterInstanceId");

    expect(illustrations).toContain("export const getByChapterInstance");
    expect(illustrations).toContain("export const beginVersion");
    expect(illustrations).toContain("export const autoIllustrate = action");
    expect(mediaAssets).toContain("export const createOrGetBySource");
    expect(mediaAssets).toContain("export const createSystemCached");
  });

  it("orchestrates theme -> fetch -> select -> cache -> persist and returns ready/error", () => {
    const illustrations = readRepoFile("convex/chapterIllustrations.ts");

    expect(illustrations).toContain("extractSlotTargetsForChapter");
    expect(illustrations).toContain("generateThemeForChapterDraft");
    expect(illustrations).toContain("fetchIllustrationCandidates");
    expect(illustrations).toContain("selectCandidatesForSlots");
    expect(illustrations).toContain("cacheSelectedProviderAssets");
    expect(illustrations).toContain("api.chapterIllustrations.beginVersion");
    expect(illustrations).toContain("api.chapterIllustrations.setReady");
    expect(illustrations).toContain("api.chapterIllustrations.setError");
    expect(illustrations).toContain("DRAFT_NOT_READY");
    expect(illustrations).toContain("NO_CANDIDATES");
  });

  it("dedupes cached media by provider/sourceId and preserves attribution", () => {
    const mediaAssets = readRepoFile("convex/mediaAssets.ts");
    const cacheAssets = readRepoFile("convex/illustrate/cacheAssets.ts");

    expect(mediaAssets).toContain('withIndex("by_source_sourceId"');
    expect(mediaAssets).toContain("reused: true as const");
    expect(cacheAssets).toContain("api.mediaAssets.createSystemCached");
    expect(cacheAssets).toContain("attribution:");
    expect(cacheAssets).toContain("authorName");
    expect(cacheAssets).toContain("licenseUrl");
  });
});
