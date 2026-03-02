import { describe, expect, it } from "vitest";
import { computeLayoutSignature } from "../../../../packages/shared/toc/tocLayout";
import type { LayoutSignatureInputs } from "../../../../packages/shared/toc/tocLayout";

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

describe("computeLayoutSignature", () => {
    it("returns a 16-char hex string", () => {
        const sig = computeLayoutSignature(baseInputs());
        expect(sig).toMatch(/^[0-9a-f]{16}$/);
    });

    it("is deterministic: same inputs always produce same signature", () => {
        const a = computeLayoutSignature(baseInputs());
        const b = computeLayoutSignature(baseInputs());
        expect(a).toBe(b);
    });

    it("changes when projectOrientation changes", () => {
        const portrait = computeLayoutSignature(baseInputs({ projectOrientation: "portrait" }));
        const landscape = computeLayoutSignature(baseInputs({ projectOrientation: "landscape" }));
        expect(portrait).not.toBe(landscape);
    });

    it("changes when tocPageOrientation override changes", () => {
        const inherit = computeLayoutSignature(baseInputs({ tocPageOrientation: "inherit" }));
        const override = computeLayoutSignature(baseInputs({ tocPageOrientation: "landscape" }));
        expect(inherit).not.toBe(override);
    });

    it("changes when safeAreaWidthPx changes", () => {
        const w728 = computeLayoutSignature(baseInputs({ safeAreaWidthPx: 728 }));
        const w600 = computeLayoutSignature(baseInputs({ safeAreaWidthPx: 600 }));
        expect(w728).not.toBe(w600);
    });

    it("changes when safeAreaHeightPx changes", () => {
        const h968 = computeLayoutSignature(baseInputs({ safeAreaHeightPx: 968 }));
        const h800 = computeLayoutSignature(baseInputs({ safeAreaHeightPx: 800 }));
        expect(h968).not.toBe(h800);
    });

    it("changes when reflowModeEnabled toggles", () => {
        const off = computeLayoutSignature(baseInputs({ reflowModeEnabled: false }));
        const on = computeLayoutSignature(baseInputs({ reflowModeEnabled: true, reflowSafeAreaPercent: 0.8 }));
        expect(off).not.toBe(on);
    });

    it("changes when page order changes", () => {
        const original = computeLayoutSignature(baseInputs());
        const reordered = computeLayoutSignature(
            baseInputs({
                pageOrder: [
                    { id: "ch2", title: "Chapter Two", showInToc: true },
                    { id: "ch1", title: "Chapter One", showInToc: true },
                ],
            })
        );
        expect(original).not.toBe(reordered);
    });

    it("changes when a page title changes", () => {
        const before = computeLayoutSignature(baseInputs());
        const after = computeLayoutSignature(
            baseInputs({
                pageOrder: [
                    { id: "ch1", title: "Chapter One – Revised", showInToc: true },
                    { id: "ch2", title: "Chapter Two", showInToc: true },
                ],
            })
        );
        expect(before).not.toBe(after);
    });

    it("changes when a page's showInToc flag flips", () => {
        const before = computeLayoutSignature(baseInputs());
        const after = computeLayoutSignature(
            baseInputs({
                pageOrder: [
                    { id: "ch1", title: "Chapter One", showInToc: false },
                    { id: "ch2", title: "Chapter Two", showInToc: true },
                ],
            })
        );
        expect(before).not.toBe(after);
    });

    it("changes when tocTemplate changes", () => {
        const dots = computeLayoutSignature(baseInputs({ tocTemplate: "classic_dots" }));
        const minimal = computeLayoutSignature(baseInputs({ tocTemplate: "minimal" }));
        expect(dots).not.toBe(minimal);
    });

    it("changes when tocWrapMode changes", () => {
        const wrap = computeLayoutSignature(baseInputs({ tocWrapMode: "wrap" }));
        const truncate = computeLayoutSignature(baseInputs({ tocWrapMode: "truncate" }));
        expect(wrap).not.toBe(truncate);
    });

    it("changes when dotLeaders toggle", () => {
        const on = computeLayoutSignature(baseInputs({ tocDotLeaders: true }));
        const off = computeLayoutSignature(baseInputs({ tocDotLeaders: false }));
        expect(on).not.toBe(off);
    });
});
