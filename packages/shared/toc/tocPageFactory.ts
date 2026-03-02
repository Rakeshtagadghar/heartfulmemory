/**
 * Sprint 34 – ToC page factory.
 *
 * Pure factory function to create a TABLE_OF_CONTENTS page descriptor
 * ready for insertion into a storybook.
 */

import type { PageType } from "./tocTypes";

// ---------------------------------------------------------------------------
// Page descriptor (matches the Convex `pages` table shape)
// ---------------------------------------------------------------------------

export type TocPageDescriptor = {
    pageType: PageType;
    title: string;
    showInToc: false;
    orientation: "inherit" | "portrait" | "landscape";
    orderIndex: number;
    /** Fields that mirror the host book but are authored by caller */
    sizePreset: string;
    widthPx: number;
    heightPx: number;
    margins: { top: number; right: number; bottom: number; left: number };
};

export type InsertPosition =
    | { strategy: "beginning" }
    | { strategy: "after_cover" }
    | { strategy: "before_first_chapter" }
    | { strategy: "at_index"; index: number };

// ---------------------------------------------------------------------------
// resolveInsertIndex
// ---------------------------------------------------------------------------

/**
 * Determines the `orderIndex` where a ToC page should be placed.
 *
 * @param pages – the current list of pages with id, pageType, and orderIndex.
 * @param position – the desired insert strategy.
 * @returns the 0-based index at which to insert.
 */
export function resolveInsertIndex(
    pages: Array<{ id: string; pageType?: string | null; orderIndex: number }>,
    position: InsertPosition
): number {
    const sorted = [...pages].sort((a, b) => a.orderIndex - b.orderIndex);

    switch (position.strategy) {
        case "beginning":
            return 0;

        case "after_cover": {
            const coverIdx = sorted.findIndex((p) => p.pageType === "COVER");
            return coverIdx >= 0 ? coverIdx + 1 : 0;
        }

        case "before_first_chapter": {
            const chapterIdx = sorted.findIndex((p) => p.pageType === "CHAPTER_COVER");
            return chapterIdx >= 0 ? chapterIdx : sorted.length;
        }

        case "at_index":
            return Math.max(0, Math.min(position.index, sorted.length));
    }
}

// ---------------------------------------------------------------------------
// createTocPage
// ---------------------------------------------------------------------------

export type BookDimensions = {
    sizePreset: string;
    widthPx: number;
    heightPx: number;
    margins: { top: number; right: number; bottom: number; left: number };
};

/**
 * Returns a fully-formed page descriptor for a new TABLE_OF_CONTENTS page.
 * The caller inserts this into Convex (filling in storybookId, ownerId, etc.).
 *
 * `showInToc` is always `false` – the ToC page does not list itself.
 * `orientation` defaults to `"inherit"` (uses the project orientation).
 */
export function createTocPage(
    orderIndex: number,
    bookDimensions: BookDimensions,
    overrides?: { orientation?: "inherit" | "portrait" | "landscape"; title?: string }
): TocPageDescriptor {
    return {
        pageType: "TABLE_OF_CONTENTS",
        title: overrides?.title ?? "Contents",
        showInToc: false,
        orientation: overrides?.orientation ?? "inherit",
        orderIndex,
        sizePreset: bookDimensions.sizePreset,
        widthPx: bookDimensions.widthPx,
        heightPx: bookDimensions.heightPx,
        margins: { ...bookDimensions.margins },
    };
}
