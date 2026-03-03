import { describe, expect, it } from "vitest";
import {
    createTocPage,
    resolveInsertIndex,
} from "../../../../packages/shared/toc/tocPageFactory";

const dims = {
    sizePreset: "BOOK_8_5X11",
    widthPx: 816,
    heightPx: 1056,
    margins: { top: 44, right: 44, bottom: 44, left: 44 },
};

const samplePages = [
    { id: "cover", pageType: "COVER" as const, orderIndex: 0 },
    { id: "ch1", pageType: "CHAPTER_COVER" as const, orderIndex: 1 },
    { id: "p1", pageType: "PAGE" as const, orderIndex: 2 },
    { id: "ch2", pageType: "CHAPTER_COVER" as const, orderIndex: 3 },
];

describe("resolveInsertIndex", () => {
    it("beginning always inserts at index 0", () => {
        expect(resolveInsertIndex(samplePages, { strategy: "beginning" })).toBe(0);
    });

    it("after_cover inserts after the COVER page", () => {
        expect(resolveInsertIndex(samplePages, { strategy: "after_cover" })).toBe(1);
    });

    it("after_cover falls back to 0 when no cover exists", () => {
        const noCover = samplePages.filter((p) => p.pageType !== "COVER");
        expect(resolveInsertIndex(noCover, { strategy: "after_cover" })).toBe(0);
    });

    it("before_first_chapter inserts before the first CHAPTER_COVER", () => {
        expect(resolveInsertIndex(samplePages, { strategy: "before_first_chapter" })).toBe(1);
    });

    it("before_first_chapter appends when no chapter exists", () => {
        const noChapters = samplePages.filter((p) => p.pageType !== "CHAPTER_COVER");
        expect(resolveInsertIndex(noChapters, { strategy: "before_first_chapter" })).toBe(noChapters.length);
    });

    it("at_index clamps to valid range", () => {
        expect(resolveInsertIndex(samplePages, { strategy: "at_index", index: -5 })).toBe(0);
        expect(resolveInsertIndex(samplePages, { strategy: "at_index", index: 100 })).toBe(samplePages.length);
        expect(resolveInsertIndex(samplePages, { strategy: "at_index", index: 2 })).toBe(2);
    });

    it("handles empty pages array", () => {
        expect(resolveInsertIndex([], { strategy: "beginning" })).toBe(0);
        expect(resolveInsertIndex([], { strategy: "after_cover" })).toBe(0);
        expect(resolveInsertIndex([], { strategy: "before_first_chapter" })).toBe(0);
    });
});

describe("createTocPage", () => {
    it("creates a page with TABLE_OF_CONTENTS type", () => {
        const page = createTocPage(1, dims);
        expect(page.pageType).toBe("TABLE_OF_CONTENTS");
    });

    it("sets showInToc to false (ToC does not list itself)", () => {
        const page = createTocPage(1, dims);
        expect(page.showInToc).toBe(false);
    });

    it("defaults orientation to inherit", () => {
        const page = createTocPage(1, dims);
        expect(page.orientation).toBe("inherit");
    });

    it("applies orientation override", () => {
        const page = createTocPage(1, dims, { orientation: "landscape" });
        expect(page.orientation).toBe("landscape");
    });

    it("defaults title to Contents", () => {
        const page = createTocPage(1, dims);
        expect(page.title).toBe("Contents");
    });

    it("accepts custom title", () => {
        const page = createTocPage(1, dims, { title: "Table of Contents" });
        expect(page.title).toBe("Table of Contents");
    });

    it("copies book dimensions", () => {
        const page = createTocPage(2, dims);
        expect(page.widthPx).toBe(816);
        expect(page.heightPx).toBe(1056);
        expect(page.margins).toEqual({ top: 44, right: 44, bottom: 44, left: 44 });
        expect(page.orderIndex).toBe(2);
    });
});
