import type { RenderableDocumentV1 } from "../contract/renderContractV1";
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
  const rendered = renderPageLayersHtml(doc, pageId);
  return {
    html: `<section data-page-id="${esc(page.id)}" style="position:relative;width:${page.widthPx}px;height:${page.heightPx}px;background:${esc(page.background.fill)};">${rendered.html}</section>`,
    warnings: rendered.warnings
  };
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
