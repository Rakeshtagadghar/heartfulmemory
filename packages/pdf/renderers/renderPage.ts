import type { RenderableDocumentV1, RenderablePageV1 } from "../contract/renderContractV1";
import { flattenNodesForPage } from "../layout/flattenNodes";
import { renderTextNode } from "./renderText";
import { renderImageNode } from "./renderImage";
import { renderShapeNode } from "./renderShape";
import { renderLineNode } from "./renderLine";
import { renderFrameNode } from "./renderFrame";
import { renderGroupNode } from "./renderGroup";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderPageHtml(doc: RenderableDocumentV1, pageId: string) {
  const page = doc.pages.find((value) => value.id === pageId);
  if (!page) throw new Error(`Page not found: ${pageId}`);

  // ── ToC page: inject Table of Contents HTML ──
  const isTocPage = page.pageType === "TABLE_OF_CONTENTS" || page.pageType === "TABLE_OF_CONTENTS_CONTINUATION";
  if (isTocPage) {
    const tocHtml = renderTocPageContent(doc, page);
    return {
      html: `<section data-page-id="${esc(page.id)}" style="position:relative;width:${page.widthPx}px;height:${page.heightPx}px;background:${esc(page.background.fill)};">${tocHtml}</section>`,
      warnings: [] as string[]
    };
  }

  const rendered = renderPageLayersHtml(doc, pageId);
  return {
    html: `<section data-page-id="${esc(page.id)}" style="position:relative;width:${page.widthPx}px;height:${page.heightPx}px;background:${esc(page.background.fill)};">${rendered.html}</section>`,
    warnings: rendered.warnings
  };
}

function renderTocPageContent(doc: RenderableDocumentV1, page: RenderablePageV1): string {
  const safeLeft = page.margins.left;
  const safeTop = page.margins.top;
  const safeW = page.widthPx - page.margins.left - page.margins.right;
  const safeH = page.heightPx - page.margins.top - page.margins.bottom;
  const bookTitle = doc.storybook.title || "";
  const tocPageTypes = new Set(["TABLE_OF_CONTENTS", "TABLE_OF_CONTENTS_CONTINUATION"]);

  // Build chapter entries: titled pages that aren't cover or ToC
  const chapters = doc.pages
    .filter((p) => {
      if (p.pageType && tocPageTypes.has(p.pageType)) return false;
      if (p.pageType === "COVER") return false;
      if (!p.title || p.title.trim() === "") return false;
      return true;
    })
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((p) => ({
      title: esc(p.title!.trim()),
      pageNumber: doc.pages.filter((pg) => pg.orderIndex <= p.orderIndex).length,
    }));

  // Page number of this ToC page
  const thisPageNumber = doc.pages.filter((pg) => pg.orderIndex <= page.orderIndex).length;

  const entriesHtml = chapters.length === 0
    ? `<p style="color:#999;font-style:italic;font-size:14px;margin-top:16px;">No chapters yet.</p>`
    : chapters.map((ch) => `
      <div style="display:flex;align-items:baseline;margin-bottom:12px;line-height:1.5;">
        <span style="font-weight:700;font-size:13px;color:#111;white-space:nowrap;flex-shrink:0;text-transform:uppercase;letter-spacing:0.02em;">${ch.title}</span>
        <span style="flex:1;border-bottom:1px dotted #bbb;margin-left:8px;margin-right:8px;min-width:20px;position:relative;top:-3px;"></span>
        <span style="font-weight:700;font-size:13px;color:#111;flex-shrink:0;min-width:24px;text-align:right;font-variant-numeric:tabular-nums;">${ch.pageNumber}</span>
      </div>
    `).join("");

  return `
    <div style="position:absolute;left:${safeLeft}px;top:${safeTop}px;width:${safeW}px;height:${safeH}px;font-family:'Georgia','Times New Roman',serif;display:flex;flex-direction:column;">
      <h1 style="font-size:32px;font-weight:700;letter-spacing:0.08em;color:#111;line-height:1.2;margin:0 0 28px 0;">TABLE OF CONTENTS</h1>
      <div style="flex:1;">${entriesHtml}</div>
      <div style="display:flex;justify-content:space-between;font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.06em;">
        <span>${esc(bookTitle)}</span>
        <span>${thisPageNumber}</span>
      </div>
    </div>
  `;
}

export function renderPageLayersHtml(doc: RenderableDocumentV1, pageId: string) {
  const flattened = flattenNodesForPage(doc, pageId).sort((a, b) => a.orderIndex - b.orderIndex);
  const warnings: string[] = [];
  const html = flattened
    .map(({ node }) => {
      if (node.type === "text") {
        const rendered = renderTextNode(node);
        warnings.push(...rendered.warnings);
        return rendered.html;
      }
      if (node.type === "image") return renderImageNode({ node, assets: doc.assets }).html;
      if (node.type === "shape") return renderShapeNode(node).html;
      if (node.type === "line") return renderLineNode(node).html;
      if (node.type === "frame") return renderFrameNode({ node, assets: doc.assets }).html;
      if (node.type === "group") return renderGroupNode(node).html;
      return "";
    })
    .join("");

  return {
    html,
    warnings
  };
}
