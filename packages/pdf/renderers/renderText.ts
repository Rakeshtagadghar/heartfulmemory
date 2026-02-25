import { getTextNodePlainText, normalizeTextNodeStyleV1 } from "../../editor/nodes/textNode";
import { mapEditorFontFamilyToPdfFamily, normalizePdfFontWeight } from "../fonts/fontRegistry";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderTextNode(node: {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  style?: Record<string, unknown>;
  content?: Record<string, unknown>;
}) {
  const style = normalizeTextNodeStyleV1(node.style);
  const text = getTextNodePlainText(node.content).replaceAll("\n", "<br/>");
  const font = mapEditorFontFamilyToPdfFamily(style.fontFamily);
  return {
    html: `<div data-node-id="${esc(node.id)}" data-node-type="text" style="position:absolute;left:${node.x}px;top:${node.y}px;width:${node.w}px;height:${node.h}px;overflow:hidden;opacity:${node.opacity ?? style.opacity ?? 1};font-family:${font.familyCss}, Arial, sans-serif;font-size:${style.fontSize}px;line-height:${style.lineHeight};font-weight:${normalizePdfFontWeight(style.fontWeight)};font-style:${style.fontStyle};text-decoration:${style.textDecoration};letter-spacing:${style.letterSpacing}px;text-align:${style.textAlign};color:${esc(style.color)};">${esc(text).replaceAll("&lt;br/&gt;", "<br/>")}</div>`,
    warnings: font.warning ? [font.warning] : []
  };
}

