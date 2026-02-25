import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateRenderable } from "../../packages/pdf/contract/validateRenderable";
import { buildPageBoxModelV1 } from "../../packages/pdf/layout/pagePresets";
import { renderPageHtml } from "../../packages/pdf/renderers/renderPage";
import { toRenderableContractV1FromLegacy } from "../../packages/pdf/contract/renderContractV1";
import { createPdfDocument } from "../../packages/pdf/engine/createDocument";
import type { PdfRenderContract } from "../../packages/pdf-renderer/src/contracts";

const fixtureA = JSON.parse(readFileSync(new URL("./fixtures/fixture-a-text-heavy.json", import.meta.url), "utf8"));
const fixtureC = JSON.parse(readFileSync(new URL("./fixtures/fixture-c-layers-shapes-lines.json", import.meta.url), "utf8"));

describe("Sprint 16 PDF support", () => {
  it("validates fixture contracts deterministically", () => {
    const result = validateRenderable(fixtureA as any);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("renders page html for shape/line/text mix", () => {
    const rendered = renderPageHtml(fixtureC as any, "p1");
    expect(rendered.html).toContain("data-node-type=\"shape\"");
    expect(rendered.html).toContain("data-node-type=\"line\"");
    expect(rendered.html).toContain("data-node-type=\"text\"");
  });

  it("maps page box model for hardcopy", () => {
    const page = (fixtureA as any).pages[0];
    const box = buildPageBoxModelV1({
      preset: page.sizePreset,
      pageWidthPx: page.widthPx,
      pageHeightPx: page.heightPx,
      marginsPx: page.margins,
      exportMode: "hardcopy"
    });
    expect(box.bleedBox.w).toBeGreaterThan(box.trimBox.w);
    expect(box.safeBox.w).toBeLessThan(box.trimBox.w);
  });
});

describe.skip("Playwright PDF integration", () => {
  it("produces a PDF buffer for legacy frame contract", async () => {
    const legacyContract: PdfRenderContract = {
      exportTarget: "DIGITAL_PDF",
      storybook: {
        id: "sb_test",
        title: "Test",
        subtitle: null,
        updatedAt: "2026-02-25T00:00:00.000Z",
        settings: {}
      },
      pages: [
        {
          id: "p1",
          orderIndex: 0,
          sizePreset: "US_LETTER",
          widthPx: 816,
          heightPx: 1056,
          margins: { top: 48, right: 48, bottom: 48, left: 48, unit: "px" },
          grid: { enabled: false, columns: 12, gutter: 16, rowHeight: 16, showGuides: false },
          background: { fill: "#ffffff" }
        }
      ],
      frames: [
        {
          id: "f1",
          pageId: "p1",
          type: "TEXT",
          x: 72,
          y: 72,
          w: 500,
          h: 200,
          zIndex: 0,
          locked: false,
          style: { fontFamily: "Inter", fontSize: 20, color: "#111827" },
          content: { text: "PDF test" },
          crop: null,
          version: 1
        }
      ],
      assets: []
    };

    const renderable = toRenderableContractV1FromLegacy(legacyContract);
    expect(validateRenderable(renderable).ok).toBe(true);
    const out = await createPdfDocument({ contract: legacyContract, exportHash: "test_hash" });
    expect(out.pdf.byteLength).toBeGreaterThan(0);
    expect(out.meta.pageCount).toBe(1);
  });
});
