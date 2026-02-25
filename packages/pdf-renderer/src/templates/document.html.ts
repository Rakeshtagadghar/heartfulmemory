import type { PdfRenderContract, PdfRenderWarning } from "../contracts";
import { getPageCss } from "./page.css";
import { buildDebugOverlayHtml, type PdfDebugOverlayOptions } from "../../../pdf/debug/debugOverlays";
import { toRenderableContractV1FromLegacy } from "../../../pdf/contract/renderContractV1";
import { renderPageLayersHtml } from "../../../pdf/renderers/renderPage";
import { resolveFrameImage } from "../imageResolver";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildHtmlDocument(
  contract: PdfRenderContract,
  options?: { debug?: PdfDebugOverlayOptions }
): { html: string; warnings: PdfRenderWarning[] } {
  const warnings: PdfRenderWarning[] = [];
  const renderableDoc = options?.debug ? toRenderableContractV1FromLegacy(contract) : null;
  const adaptedDoc = toRenderableContractV1FromLegacy(contract);
  const pages = contract.pages.slice().sort((a, b) => a.orderIndex - b.orderIndex);
  for (const frame of contract.frames) {
    if (frame.type !== "IMAGE" && frame.type !== "FRAME") continue;
    warnings.push(...resolveFrameImage(contract, frame).warnings);
  }

  const pageHtml = pages
    .map((page, pageIndex) => {
      const frameHtml = renderPageLayersHtml(adaptedDoc, page.id).html;

      return `
<section class="pdf-page" data-page-id="${esc(page.id)}" style="width:${page.widthPx}px;height:${page.heightPx}px;background:${esc(page.background.fill)};">
  <div class="pdf-safe-area" style="left:${page.margins.left}px;top:${page.margins.top}px;width:${page.widthPx - page.margins.left - page.margins.right}px;height:${page.heightPx - page.margins.top - page.margins.bottom}px;"></div>
  ${frameHtml}
  ${
    renderableDoc && options?.debug
      ? buildDebugOverlayHtml({
          doc: renderableDoc,
          page: renderableDoc.pages.find((p) => p.id === page.id) ?? {
            id: page.id,
            orderIndex: page.orderIndex,
            sizePreset: page.sizePreset,
            widthPx: page.widthPx,
            heightPx: page.heightPx,
            margins: page.margins,
            background: page.background,
            drawOrder: []
          },
          options: options.debug
        })
      : ""
  }
  <div class="pdf-footer">
    <span>${esc(contract.storybook.title)}</span>
    <span>${pageIndex + 1}</span>
  </div>
</section>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(contract.storybook.title)} PDF Export</title>
    <style>${getPageCss()}</style>
  </head>
  <body>
    <main class="document-root">${pageHtml}</main>
  </body>
</html>`;

  return { html, warnings };
}
