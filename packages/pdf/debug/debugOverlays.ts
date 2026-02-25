import type { RenderableDocumentV1, RenderablePageV1 } from "../contract/renderContractV1";
import { buildPageBoxModelV1 } from "../layout/pagePresets";

export type PdfDebugOverlayOptions = {
  showSafeArea?: boolean;
  showBleed?: boolean;
  showNodeBounds?: boolean;
  showNodeIds?: boolean;
};

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildDebugOverlayHtml(input: {
  doc: RenderableDocumentV1;
  page: RenderablePageV1;
  options: PdfDebugOverlayOptions;
}) {
  const boxModel = buildPageBoxModelV1({
    preset: input.page.sizePreset,
    pageWidthPx: input.page.widthPx,
    pageHeightPx: input.page.heightPx,
    marginsPx: input.page.margins,
    exportMode: input.doc.exportTarget === "HARDCOPY_PRINT_PDF" ? "hardcopy" : "digital"
  });

  const nodes = input.doc.nodes.filter((node) => node.pageId === input.page.id);
  const parts: string[] = [];
  if (input.options.showSafeArea) {
    parts.push(
      `<div data-debug="safe" style="position:absolute;left:${boxModel.safeBox.x}px;top:${boxModel.safeBox.y}px;width:${boxModel.safeBox.w}px;height:${boxModel.safeBox.h}px;border:1px dashed rgba(245,158,11,.7);pointer-events:none;"></div>`
    );
  }
  if (input.options.showBleed) {
    parts.push(
      `<div data-debug="bleed" style="position:absolute;left:${boxModel.bleedBox.x}px;top:${boxModel.bleedBox.y}px;width:${boxModel.bleedBox.w}px;height:${boxModel.bleedBox.h}px;border:1px dashed rgba(239,68,68,.6);pointer-events:none;"></div>`
    );
  }
  if (input.options.showNodeBounds) {
    for (const node of nodes) {
      parts.push(
        `<div data-debug-node="${esc(node.id)}" style="position:absolute;left:${node.x}px;top:${node.y}px;width:${node.w}px;height:${node.h}px;border:1px solid rgba(59,130,246,.55);pointer-events:none;">${
          input.options.showNodeIds
            ? `<span style="position:absolute;left:0;top:0;background:rgba(59,130,246,.85);color:#fff;font:10px/1 monospace;padding:2px 4px;">${esc(node.id)}</span>`
            : ""
        }</div>`
      );
    }
  }
  return parts.join("");
}

