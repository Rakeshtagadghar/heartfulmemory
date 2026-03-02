import { describe, expect, it } from "vitest";
import { isTocCacheStale, emptyTocRenderCache } from "../../../../packages/shared/toc/tocTypes";
import type { TocRenderCache } from "../../../../packages/shared/toc/tocTypes";
import { resolveEffectiveOrientation } from "../../../../packages/shared/toc/resolveOrientation";
import { handleTocLayoutEvent } from "../../../../packages/shared/toc/tocEventTypes";
import type { TocLayoutEvent } from "../../../../packages/shared/toc/tocEventTypes";
import { computeLayoutSignature } from "../../../../packages/shared/toc/tocLayout";
import type { LayoutSignatureInputs } from "../../../../packages/shared/toc/tocLayout";

function validCache(overrides: Partial<TocRenderCache> = {}): TocRenderCache {
    return {
        layoutSignature: "abc123",
        paginationVersion: "v42",
        pageIdToPageNumberMap: { ch1: 3 },
        lastComputedAt: Date.now(),
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// isTocCacheStale
// ---------------------------------------------------------------------------

describe("isTocCacheStale", () => {
    it("returns true for an empty cache", () => {
        expect(isTocCacheStale(emptyTocRenderCache(), "sig", "v1")).toBe(true);
    });

    it("returns true when signatures differ", () => {
        expect(isTocCacheStale(validCache(), "different-sig", "v42")).toBe(true);
    });

    it("returns true when pagination versions differ", () => {
        expect(isTocCacheStale(validCache(), "abc123", "v99")).toBe(true);
    });

    it("returns false when both match", () => {
        expect(isTocCacheStale(validCache(), "abc123", "v42")).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// resolveEffectiveOrientation
// ---------------------------------------------------------------------------

describe("resolveEffectiveOrientation", () => {
    it("returns project orientation when page is inherit", () => {
        expect(resolveEffectiveOrientation("inherit", "landscape")).toBe("landscape");
        expect(resolveEffectiveOrientation("inherit", "portrait")).toBe("portrait");
    });

    it("returns project orientation when page field is null/undefined", () => {
        expect(resolveEffectiveOrientation(null, "landscape")).toBe("landscape");
        expect(resolveEffectiveOrientation(undefined, "portrait")).toBe("portrait");
    });

    it("returns page override when explicitly set", () => {
        expect(resolveEffectiveOrientation("landscape", "portrait")).toBe("landscape");
        expect(resolveEffectiveOrientation("portrait", "landscape")).toBe("portrait");
    });

    it("defaults project to portrait when null", () => {
        expect(resolveEffectiveOrientation("inherit", null)).toBe("portrait");
        expect(resolveEffectiveOrientation("inherit", undefined)).toBe("portrait");
    });
});

// ---------------------------------------------------------------------------
// handleTocLayoutEvent
// ---------------------------------------------------------------------------

describe("handleTocLayoutEvent", () => {
    const staleEvents: TocLayoutEvent[] = [
        { type: "PROJECT_ORIENTATION_CHANGED", orientation: "landscape" },
        { type: "PAGE_ORIENTATION_CHANGED", pageId: "p1", orientation: "landscape" },
        { type: "REFLOW_MODE_TOGGLED", enabled: true },
        { type: "SAFE_AREA_DIMENSIONS_CHANGED", widthPx: 600, heightPx: 800 },
        { type: "PAGE_REORDERED" },
        { type: "PAGE_ADDED", pageId: "p99" },
        { type: "PAGE_REMOVED", pageId: "p1" },
        { type: "PAGE_TITLE_UPDATED", pageId: "p1", title: "New" },
        { type: "PAGE_TOC_VISIBILITY_UPDATED", pageId: "p1", showInToc: false },
        { type: "TEMPLATE_CHANGED" },
        { type: "TYPOGRAPHY_CHANGED" },
    ];

    it.each(staleEvents.map((e) => [e.type, e]))("returns mark_stale for %s", (_name, event) => {
        const result = handleTocLayoutEvent(event as TocLayoutEvent);
        expect(result.action).toBe("mark_stale");
    });

    it("returns update_cache for PAGINATION_COMPUTED", () => {
        const result = handleTocLayoutEvent({
            type: "PAGINATION_COMPUTED",
            paginationVersion: "v99",
            pageIdToPageNumberMap: { ch1: 2, ch2: 5 },
        });
        expect(result.action).toBe("update_cache");
        if (result.action === "update_cache") {
            expect(result.paginationVersion).toBe("v99");
            expect(result.pageIdToPageNumberMap).toEqual({ ch1: 2, ch2: 5 });
        }
    });
});

// ---------------------------------------------------------------------------
// Orientation change → signature changes (spec TOC_US_007)
// ---------------------------------------------------------------------------

describe("Orientation change invalidates layout signature", () => {
    function baseInputs(overrides: Partial<LayoutSignatureInputs> = {}): LayoutSignatureInputs {
        return {
            projectOrientation: "portrait",
            tocPageOrientation: "inherit",
            safeAreaWidthPx: 728,
            safeAreaHeightPx: 968,
            reflowModeEnabled: false,
            reflowSafeAreaPercent: null,
            tocTemplate: "classic_dots",
            tocWrapMode: "wrap",
            tocIndentPerLevelPx: 18,
            tocDotLeaders: true,
            tocIncludePageNumbers: true,
            tocMaxLinesPerEntry: 3,
            pageOrder: [
                { id: "ch1", title: "Chapter One", showInToc: true },
                { id: "ch2", title: "Chapter Two", showInToc: true },
            ],
            ...overrides,
        };
    }

    it("portrait→landscape makes the cached signature stale", () => {
        const sigPortrait = computeLayoutSignature(baseInputs({ projectOrientation: "portrait" }));
        const sigLandscape = computeLayoutSignature(baseInputs({ projectOrientation: "landscape" }));
        const cache = validCache({ layoutSignature: sigPortrait });
        expect(isTocCacheStale(cache, sigLandscape, cache.paginationVersion)).toBe(true);
    });

    it("landscape→portrait also makes it stale", () => {
        const sigLandscape = computeLayoutSignature(baseInputs({ projectOrientation: "landscape" }));
        const sigPortrait = computeLayoutSignature(baseInputs({ projectOrientation: "portrait" }));
        const cache = validCache({ layoutSignature: sigLandscape });
        expect(isTocCacheStale(cache, sigPortrait, cache.paginationVersion)).toBe(true);
    });

    it("page-level orientation override changes signature too", () => {
        const sigInherit = computeLayoutSignature(baseInputs({ tocPageOrientation: "inherit" }));
        const sigOverride = computeLayoutSignature(baseInputs({ tocPageOrientation: "landscape" }));
        expect(sigInherit).not.toBe(sigOverride);
    });
});
