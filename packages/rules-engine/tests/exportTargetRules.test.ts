import { describe, expect, it } from "vitest";
import { validateExportContract } from "../src/index";
import type { PdfRenderContract } from "../../pdf-renderer/src/contracts";

function baseContract(target: PdfRenderContract["exportTarget"]): PdfRenderContract {
  return {
    exportTarget: target,
    storybook: {
      id: "book_1",
      title: "Test",
      subtitle: null,
      updatedAt: new Date().toISOString(),
      settings: {}
    },
    pages: [
      {
        id: "p1",
        orderIndex: 0,
        sizePreset: "A4",
        widthPx: 794,
        heightPx: 1123,
        margins: { top: 48, right: 48, bottom: 48, left: 48, unit: "px" },
        grid: { enabled: true, columns: 12, gutter: 12, rowHeight: 12, showGuides: true },
        background: { fill: "#fff" }
      }
    ],
    frames: [],
    assets: []
  };
}

describe("export target rules", () => {
  it("blocks hardcopy text frame outside safe area", () => {
    const contract = baseContract("HARDCOPY_PRINT_PDF");
    contract.frames.push({
      id: "f1",
      pageId: "p1",
      type: "TEXT",
      x: 10,
      y: 10,
      w: 200,
      h: 100,
      zIndex: 1,
      locked: false,
      style: {},
      content: { text: "Hello" },
      crop: null,
      version: 1
    });
    const result = validateExportContract(contract);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.some((issue) => issue.code === "PRINT_TEXT_OUTSIDE_SAFE_AREA")).toBe(true);
  });

  it("warns but does not block digital low-res image", () => {
    const contract = baseContract("DIGITAL_PDF");
    contract.assets.push({ id: "a1", width: 800, height: 600 });
    contract.frames.push({
      id: "f2",
      pageId: "p1",
      type: "IMAGE",
      x: 100,
      y: 100,
      w: 300,
      h: 240,
      zIndex: 1,
      locked: false,
      style: {},
      content: { assetId: "a1" },
      crop: null,
      version: 1
    });
    const result = validateExportContract(contract);
    expect(result.ok).toBe(true);
    expect(result.warnings.some((issue) => issue.code === "PRINT_LOW_RES_IMAGE")).toBe(true);
  });
});
