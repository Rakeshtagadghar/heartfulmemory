import { describe, expect, it } from "vitest";
import { buildTocEntries } from "../../../../packages/shared/toc/tocLayout";
import type { TocSourcePage } from "../../../../packages/shared/toc/tocLayout";
import { DEFAULT_TOC_SETTINGS } from "../../../../packages/shared/toc/tocTypes";

function makePage(overrides: Partial<TocSourcePage> & { id: string; orderIndex: number }): TocSourcePage {
    return {
        pageType: "PAGE",
        title: "Untitled",
        showInToc: true,
        ...overrides,
    };
}

describe("buildTocEntries", () => {
    it("returns empty array when no pages", () => {
        expect(buildTocEntries([], DEFAULT_TOC_SETTINGS)).toEqual([]);
    });

    it("excludes COVER pages", () => {
        const pages = [makePage({ id: "p1", orderIndex: 0, pageType: "COVER" })];
        expect(buildTocEntries(pages, DEFAULT_TOC_SETTINGS)).toHaveLength(0);
    });

    it("excludes TABLE_OF_CONTENTS pages", () => {
        const pages = [makePage({ id: "p1", orderIndex: 0, pageType: "TABLE_OF_CONTENTS" })];
        expect(buildTocEntries(pages, DEFAULT_TOC_SETTINGS)).toHaveLength(0);
    });

    it("excludes TABLE_OF_CONTENTS_CONTINUATION pages", () => {
        const pages = [makePage({ id: "p1", orderIndex: 0, pageType: "TABLE_OF_CONTENTS_CONTINUATION" })];
        expect(buildTocEntries(pages, DEFAULT_TOC_SETTINGS)).toHaveLength(0);
    });

    it("includes CHAPTER_COVER in chapters_only mode", () => {
        const pages = [
            makePage({ id: "ch1", orderIndex: 0, pageType: "CHAPTER_COVER", title: "Chapter One" }),
            makePage({ id: "pg1", orderIndex: 1, pageType: "PAGE", title: "Page 1" }),
        ];
        const entries = buildTocEntries(pages, { includeMode: "chapters_only" });
        expect(entries).toHaveLength(1);
        expect(entries[0].sourcePageId).toBe("ch1");
        expect(entries[0].title).toBe("Chapter One");
    });

    it("includes both CHAPTER_COVER and PAGE in chapters_and_pages mode", () => {
        const pages = [
            makePage({ id: "ch1", orderIndex: 0, pageType: "CHAPTER_COVER" }),
            makePage({ id: "pg1", orderIndex: 1, pageType: "PAGE" }),
        ];
        const entries = buildTocEntries(pages, { includeMode: "chapters_and_pages" });
        expect(entries).toHaveLength(2);
    });

    it("respects showInToc: false", () => {
        const pages = [
            makePage({ id: "ch1", orderIndex: 0, pageType: "CHAPTER_COVER", showInToc: false }),
            makePage({ id: "ch2", orderIndex: 1, pageType: "CHAPTER_COVER", showInToc: true }),
        ];
        const entries = buildTocEntries(pages, { includeMode: "chapters_only" });
        expect(entries).toHaveLength(1);
        expect(entries[0].sourcePageId).toBe("ch2");
    });

    it("sets computedPageNumber to null for all entries", () => {
        const pages = [makePage({ id: "ch1", orderIndex: 0, pageType: "CHAPTER_COVER" })];
        const [entry] = buildTocEntries(pages, { includeMode: "chapters_only" });
        expect(entry.computedPageNumber).toBeNull();
    });

    it("assigns level 0 to CHAPTER_COVER and level 1 to PAGE", () => {
        const pages = [
            makePage({ id: "ch1", orderIndex: 0, pageType: "CHAPTER_COVER" }),
            makePage({ id: "pg1", orderIndex: 1, pageType: "PAGE" }),
        ];
        const entries = buildTocEntries(pages, { includeMode: "chapters_and_pages" });
        expect(entries[0].level).toBe(0);
        expect(entries[1].level).toBe(1);
    });

    it("returns entries sorted by orderIndex regardless of input order", () => {
        const pages = [
            makePage({ id: "ch3", orderIndex: 2, pageType: "CHAPTER_COVER", title: "Three" }),
            makePage({ id: "ch1", orderIndex: 0, pageType: "CHAPTER_COVER", title: "One" }),
            makePage({ id: "ch2", orderIndex: 1, pageType: "CHAPTER_COVER", title: "Two" }),
        ];
        const entries = buildTocEntries(pages, { includeMode: "chapters_only" });
        expect(entries.map((e) => e.title)).toEqual(["One", "Two", "Three"]);
    });

    it("sets targetAnchorId derived from sourcePageId", () => {
        const pages = [makePage({ id: "ch1", orderIndex: 0, pageType: "CHAPTER_COVER" })];
        const [entry] = buildTocEntries(pages, { includeMode: "chapters_only" });
        expect(entry.targetAnchorId).toBe("toc-target-ch1");
    });

    it("uses 'Untitled' when page title is null or undefined", () => {
        const pages = [makePage({ id: "ch1", orderIndex: 0, pageType: "CHAPTER_COVER", title: undefined })];
        const [entry] = buildTocEntries(pages, { includeMode: "chapters_only" });
        expect(entry.title).toBe("Untitled");
    });
});
