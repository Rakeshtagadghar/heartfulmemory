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
      // ── ToC page: inject Table of Contents HTML ──
      const isTocPage = page.pageType === "TABLE_OF_CONTENTS" || page.pageType === "TABLE_OF_CONTENTS_CONTINUATION";
      let frameHtml: string;
      if (isTocPage) {
        const safeLeft = page.margins.left;
        const safeTop = page.margins.top;
        const safeW = page.widthPx - page.margins.left - page.margins.right;
        const safeH = page.heightPx - page.margins.top - page.margins.bottom;
        const tocPageTypes = new Set(["TABLE_OF_CONTENTS", "TABLE_OF_CONTENTS_CONTINUATION"]);

        const chapters = pages
          .filter((p) => {
            if (p.pageType && tocPageTypes.has(p.pageType)) return false;
            if (p.pageType === "COVER") return false;
            if (!p.title || p.title.trim() === "") return false;
            return true;
          })
          .map((p) => ({
            title: esc(p.title!.trim()),
            pageNumber: pages.indexOf(p) + 1,
          }));

        const entriesHtml = chapters.length === 0
          ? `<p style="color:#999;font-style:italic;font-size:14px;margin-top:16px;">No chapters yet.</p>`
          : chapters.map((ch) => `
            <div style="display:flex;align-items:baseline;margin-bottom:12px;line-height:1.5;">
              <span style="font-weight:700;font-size:13px;color:#111;white-space:nowrap;flex-shrink:0;text-transform:uppercase;letter-spacing:0.02em;">${ch.title}</span>
              <span style="flex:1;border-bottom:1px dotted #bbb;margin-left:8px;margin-right:8px;min-width:20px;position:relative;top:-3px;"></span>
              <span style="font-weight:700;font-size:13px;color:#111;flex-shrink:0;min-width:24px;text-align:right;font-variant-numeric:tabular-nums;">${ch.pageNumber}</span>
            </div>
          `).join("");

        frameHtml = `
          <div style="position:absolute;left:${safeLeft}px;top:${safeTop}px;width:${safeW}px;height:${safeH}px;font-family:'Georgia','Times New Roman',serif;display:flex;flex-direction:column;">
            <h1 style="font-size:32px;font-weight:700;letter-spacing:0.08em;color:#111;line-height:1.2;margin:0 0 28px 0;">TABLE OF CONTENTS</h1>
            <div style="flex:1;">${entriesHtml}</div>
          </div>
        `;
      } else {
        frameHtml = renderPageLayersHtml(adaptedDoc, page.id).html;
      }

      return `
<section class="pdf-page" data-page-id="${esc(page.id)}" style="width:${page.widthPx}px;height:${page.heightPx}px;background:${esc(page.background.fill)};">
  <div class="pdf-safe-area" style="left:${page.margins.left}px;top:${page.margins.top}px;width:${page.widthPx - page.margins.left - page.margins.right}px;height:${page.heightPx - page.margins.top - page.margins.bottom}px;"></div>
  ${frameHtml}
  ${renderableDoc && options?.debug
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
