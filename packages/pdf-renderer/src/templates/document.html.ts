import type { PdfRenderContract, PdfRenderWarning } from "../contracts";
import { getPageCss } from "./page.css";
import { renderTextFrame } from "./frames/TextFrame";
import { renderImageFrame } from "./frames/ImageFrame";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildHtmlDocument(contract: PdfRenderContract): { html: string; warnings: PdfRenderWarning[] } {
  const warnings: PdfRenderWarning[] = [];
  const pages = contract.pages.slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const framesByPage = new Map<string, typeof contract.frames>();
  for (const page of pages) {
    framesByPage.set(
      page.id,
      contract.frames
        .filter((frame) => frame.pageId === page.id)
        .slice()
        .sort((a, b) => a.zIndex - b.zIndex)
    );
  }

  const pageHtml = pages
    .map((page, pageIndex) => {
      const frameHtml = (framesByPage.get(page.id) ?? [])
        .map((frame) => {
          if (frame.type === "TEXT") return renderTextFrame(frame);
          const rendered = renderImageFrame(contract, frame);
          warnings.push(...rendered.warnings);
          return rendered.html;
        })
        .join("");

      return `
<section class="pdf-page" data-page-id="${esc(page.id)}" style="width:${page.widthPx}px;height:${page.heightPx}px;background:${esc(page.background.fill)};">
  <div class="pdf-safe-area" style="left:${page.margins.left}px;top:${page.margins.top}px;width:${page.widthPx - page.margins.left - page.margins.right}px;height:${page.heightPx - page.margins.top - page.margins.bottom}px;"></div>
  ${frameHtml}
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

