import { normalizeLineNodeStyleV1 } from "../../editor/nodes/lineNode";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderLineNode(node: {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  opacity?: number;
  style?: Record<string, unknown>;
}) {
  const style = normalizeLineNodeStyleV1(node.style);
  const dash = style.dash?.length ? `${style.dash.join(" ")}` : "";
  return {
    html: `<div data-node-id="${esc(node.id)}" data-node-type="line" style="position:absolute;left:${node.x}px;top:${node.y + node.h / 2 - style.strokeWidth / 2}px;width:${node.w}px;height:${style.strokeWidth}px;background:${esc(style.stroke)};opacity:${node.opacity ?? style.opacity};transform:rotate(${node.rotation ?? 0}deg);transform-origin:left center;${dash ? `border-top:${style.strokeWidth}px dashed ${esc(style.stroke)};height:0;background:transparent;` : ""}"></div>`
  };
}

