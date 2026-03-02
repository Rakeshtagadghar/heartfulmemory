import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "..", "..");

function readRepoFile(relativePath: string) {
    return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Sprint 34 ToC source contracts", () => {
    it("tocTypes.ts exports PAGE_TYPES and TocSettings-related identifiers", () => {
        const src = readRepoFile("packages/shared/toc/tocTypes.ts");
        expect(src).toContain("export const PAGE_TYPES");
        expect(src).toContain("export type TocSettings");
        expect(src).toContain("export type TocEntry");
        expect(src).toContain("export type TocRenderCache");
        expect(src).toContain("export const DEFAULT_TOC_SETTINGS");
        expect(src).toContain("export function isTocCacheStale");
        expect(src).toContain("export function emptyTocRenderCache");
    });

    it("tocLayout.ts exports buildTocEntries and computeLayoutSignature", () => {
        const src = readRepoFile("packages/shared/toc/tocLayout.ts");
        expect(src).toContain("export function buildTocEntries");
        expect(src).toContain("export function computeLayoutSignature");
        expect(src).toContain("export type TocSourcePage");
        expect(src).toContain("export type LayoutSignatureInputs");
    });

    it("convex/tocSettings.ts exports getByStorybook and upsert", () => {
        const src = readRepoFile("convex/tocSettings.ts");
        expect(src).toContain("export const getByStorybook");
        expect(src).toContain("export const upsert");
    });

    it("convex/tocRenderCache.ts exports getByStorybook, markStale, and updateCache", () => {
        const src = readRepoFile("convex/tocRenderCache.ts");
        expect(src).toContain("export const getByStorybook");
        expect(src).toContain("export const markStale");
        expect(src).toContain("export const updateCache");
    });

    it("convex/schema.ts defines tocSettings and tocRenderCache tables", () => {
        const src = readRepoFile("convex/schema.ts");
        expect(src).toContain("tocSettings: defineTable(");
        expect(src).toContain("tocRenderCache: defineTable(");
        expect(src).toContain("by_storybookId");
    });

    it("pages table in schema.ts has pageType, showInToc, and orientation fields", () => {
        const src = readRepoFile("convex/schema.ts");
        expect(src).toContain("TABLE_OF_CONTENTS");
        expect(src).toContain("TABLE_OF_CONTENTS_CONTINUATION");
        expect(src).toContain("CHAPTER_COVER");
        expect(src).toContain("showInToc: v.optional(v.boolean())");
    });
});
