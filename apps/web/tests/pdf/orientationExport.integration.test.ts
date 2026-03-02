import { describe, expect, it } from "vitest";
import { renderPageHtml } from "../../../../packages/pdf/renderers/renderPage";
import type { RenderableDocumentV1 } from "../../../../packages/pdf/contract/renderContractV1";

function buildLandscapeDoc(): RenderableDocumentV1 {
  return {
    renderVersion: 1,
    exportTarget: "DIGITAL_PDF",
    storybook: {
      id: "sb-1",
      title: "Test Book",
      subtitle: null,
      updatedAt: new Date().toISOString(),
      settings: { orientation: "landscape" }
    },
    pages: [
      {
        id: "page-1",
        orderIndex: 0,
        sizePreset: "BOOK_8_5X11",
        widthPx: 1056,
        heightPx: 816,
        margins: { top: 44, right: 44, bottom: 44, left: 44, unit: "px" },
        background: { fill: "#ffffff" },
        drawOrder: []
      }
    ],
    nodes: [],
    assets: []
  };
}

function buildPortraitDoc(): RenderableDocumentV1 {
  return {
    renderVersion: 1,
    exportTarget: "DIGITAL_PDF",
    storybook: {
      id: "sb-2",
      title: "Portrait Book",
      subtitle: null,
      updatedAt: new Date().toISOString(),
      settings: { orientation: "portrait" }
    },
    pages: [
      {
        id: "page-1",
        orderIndex: 0,
        sizePreset: "BOOK_8_5X11",
        widthPx: 816,
        heightPx: 1056,
        margins: { top: 44, right: 44, bottom: 44, left: 44, unit: "px" },
        background: { fill: "#ffffff" },
        drawOrder: []
      }
    ],
    nodes: [],
    assets: []
  };
}

describe("PDF export respects orientation", () => {
  it("renders landscape page with correct dimensions", () => {
    const doc = buildLandscapeDoc();
    const result = renderPageHtml(doc, "page-1");
    expect(result.html).toContain("width:1056px");
    expect(result.html).toContain("height:816px");
  });

  it("landscape page is wider than tall", () => {
    const doc = buildLandscapeDoc();
    const page = doc.pages[0];
    expect(page.widthPx).toBeGreaterThan(page.heightPx);
  });

  it("renders portrait page with correct dimensions", () => {
    const doc = buildPortraitDoc();
    const result = renderPageHtml(doc, "page-1");
    expect(result.html).toContain("width:816px");
    expect(result.html).toContain("height:1056px");
  });

  it("portrait page is taller than wide", () => {
    const doc = buildPortraitDoc();
    const page = doc.pages[0];
    expect(page.heightPx).toBeGreaterThan(page.widthPx);
  });
});
