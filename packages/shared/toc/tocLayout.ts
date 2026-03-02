/**
 * Sprint 34 – Table of Contents layout utilities.
 *
 * Pure functions with no side-effects. Safe to run in any environment.
 */

import type { PageType, TocEntry, TocSettings } from "./tocTypes";
import { TOC_SOURCE_PAGE_TYPES, TOC_SELF_PAGE_TYPES } from "./tocTypes";

// ---------------------------------------------------------------------------
// Minimal page descriptor consumed by buildTocEntries
// ---------------------------------------------------------------------------

export type TocSourcePage = {
    id: string;
    pageType?: PageType | null;
    title?: string | null;
    showInToc?: boolean | null;
    orderIndex: number;
};

// ---------------------------------------------------------------------------
// buildTocEntries
// ---------------------------------------------------------------------------

/**
 * Derives the ordered list of ToC entries from the storybook's pages.
 *
 * Rules:
 * - ToC pages themselves (`TABLE_OF_CONTENTS*`) are always excluded.
 * - Pages with `showInToc === false` are excluded.
 * - `COVER` pages are excluded.
 * - When `includeMode === "chapters_only"` only `CHAPTER_COVER` pages are included.
 * - When `includeMode === "chapters_and_pages"` both `CHAPTER_COVER` and `PAGE` are included.
 * - `computedPageNumber` is always `null` at build time; the pagination engine writes it later.
 */
export function buildTocEntries(
    pages: TocSourcePage[],
    settings: Pick<TocSettings, "includeMode">
): TocEntry[] {
    const sorted = [...pages].sort((a, b) => a.orderIndex - b.orderIndex);

    return sorted
        .filter((page) => {
            // Never include ToC pages themselves
            const pt = page.pageType ?? "PAGE";
            if (TOC_SELF_PAGE_TYPES.includes(pt)) return false;
            if (pt === "COVER") return false;
            // Opt-out flag
            if (page.showInToc === false) return false;
            // Include mode filter
            if (settings.includeMode === "chapters_only") return pt === "CHAPTER_COVER";
            // "chapters_and_pages" or "custom": include all surviving source types
            return TOC_SOURCE_PAGE_TYPES.includes(pt);
        })
        .map((page): TocEntry => ({
            sourcePageId: page.id,
            title: page.title ?? "Untitled",
            level: page.pageType === "CHAPTER_COVER" ? 0 : 1,
            computedPageNumber: null,
            targetAnchorId: `toc-target-${page.id}`,
        }));
}

// ---------------------------------------------------------------------------
// computeLayoutSignature
// ---------------------------------------------------------------------------

export type LayoutSignatureInputs = {
    /** Effective orientation of the book ("portrait" | "landscape"). */
    projectOrientation: string;
    /** The ToC page's own orientation override, or "inherit". */
    tocPageOrientation: string;
    /** Safe-area width in px for the ToC page. */
    safeAreaWidthPx: number;
    /** Safe-area height in px for the ToC page. */
    safeAreaHeightPx: number;
    /** Whether reflow mode is currently enabled. */
    reflowModeEnabled: boolean;
    /** The effective safe-area constraint percentage (0–1), or null if not in reflow mode. */
    reflowSafeAreaPercent: number | null;
    /** Serialised TocSettings fields that affect layout (excludes manualOrder). */
    tocTemplate: string;
    tocWrapMode: string;
    tocIndentPerLevelPx: number;
    tocDotLeaders: boolean;
    tocIncludePageNumbers: boolean;
    tocMaxLinesPerEntry: number;
    /** Ordered list of visible page IDs + titles + showInToc flag. */
    pageOrder: Array<{ id: string; title: string; showInToc: boolean }>;
};

/**
 * Returns a deterministic signature string for a given set of layout inputs.
 *
 * An identical signature means the ToC render cache is still valid.
 * A changed signature means the ToC is stale and must be re-rendered.
 *
 * Implementation: we stringify the canonical input object and produce a
 * simple 32-char hex fingerprint using djb2. This is fast, pure, and good
 * enough for change detection (not cryptographic security).
 */
export function computeLayoutSignature(inputs: LayoutSignatureInputs): string {
    const canonical = JSON.stringify({
        po: inputs.projectOrientation,
        to: inputs.tocPageOrientation,
        sw: inputs.safeAreaWidthPx,
        sh: inputs.safeAreaHeightPx,
        rm: inputs.reflowModeEnabled,
        rp: inputs.reflowSafeAreaPercent,
        tt: inputs.tocTemplate,
        wm: inputs.tocWrapMode,
        il: inputs.tocIndentPerLevelPx,
        dl: inputs.tocDotLeaders,
        ip: inputs.tocIncludePageNumbers,
        ml: inputs.tocMaxLinesPerEntry,
        pg: inputs.pageOrder.map((p) => `${p.id}:${p.showInToc ? "1" : "0"}:${p.title}`),
    });

    return djb2Hex(canonical);
}

// ---------------------------------------------------------------------------
// djb2 hash → 16-char hex string (private)
// ---------------------------------------------------------------------------

function djb2Hex(str: string): string {
    // Two independent djb2 passes to get 64 bits → 16 hex chars
    let h1 = 5381;
    let h2 = 52711;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        h1 = ((h1 << 5) + h1) ^ c;
        h2 = ((h2 << 5) + h2) ^ (c * 31);
    }
    // Convert to unsigned 32-bit then hex
    const p1 = (h1 >>> 0).toString(16).padStart(8, "0");
    const p2 = (h2 >>> 0).toString(16).padStart(8, "0");
    return `${p1}${p2}`;
}
