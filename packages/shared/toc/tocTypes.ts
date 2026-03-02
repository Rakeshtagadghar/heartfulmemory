/**
 * Sprint 34 – Table of Contents shared types.
 *
 * All types are plain value objects with no runtime dependencies so they can be
 * imported in the browser, in Convex Actions, and in tests.
 */

// ---------------------------------------------------------------------------
// Page type
// ---------------------------------------------------------------------------

export const PAGE_TYPES = [
    "COVER",
    "TABLE_OF_CONTENTS",
    "TABLE_OF_CONTENTS_CONTINUATION",
    "CHAPTER_COVER",
    "PAGE",
] as const;

export type PageType = (typeof PAGE_TYPES)[number];

export function isPageType(value: unknown): value is PageType {
    return typeof value === "string" && PAGE_TYPES.includes(value as PageType);
}

/** Pages whose entries appear in the generated ToC. */
export const TOC_SOURCE_PAGE_TYPES: PageType[] = ["CHAPTER_COVER", "PAGE"];

/** Pages that are themselves ToC pages (primary + continuation). */
export const TOC_SELF_PAGE_TYPES: PageType[] = [
    "TABLE_OF_CONTENTS",
    "TABLE_OF_CONTENTS_CONTINUATION",
];

// ---------------------------------------------------------------------------
// ToC settings (stored per storybook)
// ---------------------------------------------------------------------------

export type TocIncludeMode =
    | "chapters_only"
    | "chapters_and_pages"
    | "custom";

export type TocTemplate = "minimal" | "classic_dots" | "royal";

export type TocWrapMode = "wrap" | "truncate" | "wrap_then_truncate";

export type TocSettings = {
    /** Heading shown at the top of the ToC page. */
    title: string;
    /** Which page types are included as entries. */
    includeMode: TocIncludeMode;
    /** Whether to print page numbers alongside each entry. */
    includePageNumbers: boolean;
    /** Visual template for the ToC. */
    template: TocTemplate;
    /** Show dot leaders between entry title and page number. */
    dotLeaders: boolean;
    /** Left-indent size per nesting level in px. */
    indentPerLevelPx: number;
    /** Whether the user has manually reordered / overridden entries. */
    manualOrder: boolean;
    /** When overflow: create continuation pages (true) or truncate (false). */
    allowMultiPage: boolean;
    /** How to handle entries whose title exceeds available width. */
    wrapMode: TocWrapMode;
    /** Maximum wrapped lines allowed per entry. */
    maxLinesPerEntry: number;
};

export const DEFAULT_TOC_SETTINGS: TocSettings = {
    title: "Contents",
    includeMode: "chapters_only",
    includePageNumbers: true,
    template: "classic_dots",
    dotLeaders: true,
    indentPerLevelPx: 18,
    manualOrder: false,
    allowMultiPage: true,
    wrapMode: "wrap",
    maxLinesPerEntry: 3,
};

// ---------------------------------------------------------------------------
// ToC entry (a single line in the rendered ToC)
// ---------------------------------------------------------------------------

export type TocEntry = {
    /** ID of the page this entry points to. */
    sourcePageId: string;
    /** Title shown in the entry (copied from page.title at build time). */
    title: string;
    /** Nesting level. 0 = chapter, 1 = section, etc. */
    level: number;
    /**
     * The 1-based printed page number.
     * null until pagination has been computed.
     */
    computedPageNumber: number | null;
    /**
     * Anchor ID used for internal PDF links in digital exports.
     * Derived from sourcePageId.
     */
    targetAnchorId: string;
};

// ---------------------------------------------------------------------------
// ToC render cache (staleness tracking, stored per storybook)
// ---------------------------------------------------------------------------

export type TocRenderCache = {
    /**
     * A deterministic hash of all layout-affecting inputs.
     * Empty string means "stale / never computed".
     */
    layoutSignature: string;
    /**
     * Version token produced by the pagination engine after each layout pass.
     * Changing this token means page numbers may have shifted.
     */
    paginationVersion: string;
    /** Map from page ID → 1-based printed page number. */
    pageIdToPageNumberMap: Record<string, number>;
    /** Epoch ms when this cache was last written. */
    lastComputedAt: number;
};

export function emptyTocRenderCache(): TocRenderCache {
    return {
        layoutSignature: "",
        paginationVersion: "",
        pageIdToPageNumberMap: {},
        lastComputedAt: 0,
    };
}

/** Returns true when the cache has never been computed or was explicitly invalidated. */
export function isTocCacheStale(
    cache: TocRenderCache,
    currentSignature: string,
    currentPaginationVersion: string
): boolean {
    if (!cache.layoutSignature) return true;
    if (cache.layoutSignature !== currentSignature) return true;
    if (cache.paginationVersion !== currentPaginationVersion) return true;
    return false;
}
