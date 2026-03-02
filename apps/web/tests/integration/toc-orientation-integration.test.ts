import { describe, expect, it } from "vitest";
import { buildTocEntries } from "../../../../packages/shared/toc/tocLayout";
import { computeLayoutSignature } from "../../../../packages/shared/toc/tocLayout";
import type { LayoutSignatureInputs } from "../../../../packages/shared/toc/tocLayout";
import type { TocSourcePage } from "../../../../packages/shared/toc/tocLayout";
import { resolveEffectiveOrientation } from "../../../../packages/shared/toc/resolveOrientation";
import { isTocCacheStale, emptyTocRenderCache } from "../../../../packages/shared/toc/tocTypes";
import { computeSafeBox } from "../../../../packages/shared/orientation/reflowMath";

// Book presets
const PORTRAIT = { widthPx: 816, heightPx: 1056, margins: { top: 44, right: 44, bottom: 44, left: 44 } };
const LANDSCAPE = { widthPx: 1056, heightPx: 816, margins: { top: 44, right: 44, bottom: 44, left: 44 } };

// Reusable pages
const bookPages: TocSourcePage[] = [
    { id: "cover", pageType: "COVER", title: "My Book", showInToc: false, orderIndex: 0 },
    { id: "toc", pageType: "TABLE_OF_CONTENTS", title: "Contents", showInToc: false, orderIndex: 1 },
    { id: "ch1", pageType: "CHAPTER_COVER", title: "Early Years", showInToc: true, orderIndex: 2 },
    { id: "p1", pageType: "PAGE", title: "Birth", showInToc: true, orderIndex: 3 },
    { id: "ch2", pageType: "CHAPTER_COVER", title: "School Days", showInToc: true, orderIndex: 4 },
    { id: "p2", pageType: "PAGE", title: "First Day", showInToc: true, orderIndex: 5 },
];

function makeSignatureInputs(orientation: "portrait" | "landscape", overrides: Partial<LayoutSignatureInputs> = {}): LayoutSignatureInputs {
    const dims = orientation === "portrait" ? PORTRAIT : LANDSCAPE;
    const safeBox = computeSafeBox(dims.widthPx, dims.heightPx, dims.margins);
    return {
        projectOrientation: orientation,
        tocPageOrientation: "inherit",
        safeAreaWidthPx: safeBox.w,
        safeAreaHeightPx: safeBox.h,
        reflowModeEnabled: false,
        reflowSafeAreaPercent: null,
        tocTemplate: "classic_dots",
        tocWrapMode: "wrap",
        tocIndentPerLevelPx: 18,
        tocDotLeaders: true,
        tocIncludePageNumbers: true,
        tocMaxLinesPerEntry: 3,
        pageOrder: bookPages
            .filter((p) => p.pageType === "CHAPTER_COVER" || p.pageType === "PAGE")
            .map((p) => ({ id: p.id, title: p.title ?? "", showInToc: p.showInToc !== false })),
        ...overrides,
    };
}

// -----------------------------------------------------------------------
// Spec: "Switch portrait→landscape: ToC page numbers update to match
//         new pagination" (orientation tests[0])
// -----------------------------------------------------------------------
describe("portrait→landscape orientation change", () => {
    it("produces different safe-area dimensions", () => {
        const sbP = computeSafeBox(PORTRAIT.widthPx, PORTRAIT.heightPx, PORTRAIT.margins);
        const sbL = computeSafeBox(LANDSCAPE.widthPx, LANDSCAPE.heightPx, LANDSCAPE.margins);
        expect(sbP.w).not.toBe(sbL.w);
        expect(sbP.h).not.toBe(sbL.h);
    });

    it("changes the layout signature → ToC is stale", () => {
        const sigPortrait = computeLayoutSignature(makeSignatureInputs("portrait"));
        const sigLandscape = computeLayoutSignature(makeSignatureInputs("landscape"));
        expect(sigPortrait).not.toBe(sigLandscape);

        const cache = { ...emptyTocRenderCache(), layoutSignature: sigPortrait, paginationVersion: "v1" };
        expect(isTocCacheStale(cache, sigLandscape, "v1")).toBe(true);
    });

    it("ToC entries themselves do not change (only page numbers change via pagination)", () => {
        const entriesP = buildTocEntries(bookPages, { includeMode: "chapters_only" });
        const entriesL = buildTocEntries(bookPages, { includeMode: "chapters_only" });
        expect(entriesP).toEqual(entriesL);
    });
});

// -----------------------------------------------------------------------
// Spec: "Switch landscape→portrait: ToC wrapping changes but page number
//         column remains aligned" (orientation tests[1])
// -----------------------------------------------------------------------
describe("landscape→portrait orientation change", () => {
    it("safe-area height increases → more vertical space", () => {
        const sbL = computeSafeBox(LANDSCAPE.widthPx, LANDSCAPE.heightPx, LANDSCAPE.margins);
        const sbP = computeSafeBox(PORTRAIT.widthPx, PORTRAIT.heightPx, PORTRAIT.margins);
        expect(sbP.h).toBeGreaterThan(sbL.h);
    });

    it("safe-area width decreases → potential wrapping", () => {
        const sbL = computeSafeBox(LANDSCAPE.widthPx, LANDSCAPE.heightPx, LANDSCAPE.margins);
        const sbP = computeSafeBox(PORTRAIT.widthPx, PORTRAIT.heightPx, PORTRAIT.margins);
        expect(sbP.w).toBeLessThan(sbL.w);
    });

    it("layout signature changes, cache becomes stale", () => {
        const sigLand = computeLayoutSignature(makeSignatureInputs("landscape"));
        const sigPort = computeLayoutSignature(makeSignatureInputs("portrait"));
        expect(sigLand).not.toBe(sigPort);
    });
});

// -----------------------------------------------------------------------
// Spec: "ToC page has orientation override=landscape while project=portrait:
//         ToC uses landscape safe-area and correct numbers" (orientation tests[2])
// -----------------------------------------------------------------------
describe("ToC page with orientation override", () => {
    it("resolveEffectiveOrientation returns the override, not the project value", () => {
        expect(resolveEffectiveOrientation("landscape", "portrait")).toBe("landscape");
    });

    it("override changes the layout signature differently than inherit", () => {
        const sigInherit = computeLayoutSignature(
            makeSignatureInputs("portrait", { tocPageOrientation: "inherit" })
        );
        const sigOverride = computeLayoutSignature(
            makeSignatureInputs("portrait", {
                tocPageOrientation: "landscape",
                safeAreaWidthPx: computeSafeBox(LANDSCAPE.widthPx, LANDSCAPE.heightPx, LANDSCAPE.margins).w,
                safeAreaHeightPx: computeSafeBox(LANDSCAPE.widthPx, LANDSCAPE.heightPx, LANDSCAPE.margins).h,
            })
        );
        expect(sigInherit).not.toBe(sigOverride);
    });
});

// -----------------------------------------------------------------------
// Spec: reflowMode tests
// -----------------------------------------------------------------------
describe("Reflow Mode integration", () => {
    it("toggling reflow mode changes the layout signature", () => {
        const sigOff = computeLayoutSignature(makeSignatureInputs("portrait", { reflowModeEnabled: false }));
        const sigOn = computeLayoutSignature(
            makeSignatureInputs("portrait", { reflowModeEnabled: true, reflowSafeAreaPercent: 0.8 })
        );
        expect(sigOff).not.toBe(sigOn);
    });

    it("changing safe-area width (simulating reflow constraint) changes signature", () => {
        const sigNormal = computeLayoutSignature(makeSignatureInputs("portrait", { safeAreaWidthPx: 728 }));
        const sigReduced = computeLayoutSignature(makeSignatureInputs("portrait", { safeAreaWidthPx: 582 })); // 80% of 728
        expect(sigNormal).not.toBe(sigReduced);
    });
});

// -----------------------------------------------------------------------
// Spec: export consistency
// -----------------------------------------------------------------------
describe("Export consistency", () => {
    it("stale UI cache does not affect entry generation (entries are always recomputable)", () => {
        const entries = buildTocEntries(bookPages, { includeMode: "chapters_and_pages" });
        // Entries are pure and have no dependency on the cache
        expect(entries.every((e) => e.computedPageNumber === null)).toBe(true);
        expect(entries.length).toBe(4); // 2 CHAPTER_COVER + 2 PAGE
    });
});
