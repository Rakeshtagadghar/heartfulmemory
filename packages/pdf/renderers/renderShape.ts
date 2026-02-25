import { normalizeShapeNodeContentV1, normalizeShapeNodeStyleV1 } from "../../editor/nodes/shapeNode";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderShapeNode(node: {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  style?: Record<string, unknown>;
  content?: Record<string, unknown>;
}) {
  const style = normalizeShapeNodeStyleV1(node.style);
  const content = normalizeShapeNodeContentV1(node.content);
  const radius = content.shapeType === "circle" ? "9999px" : `${style.radius ?? 0}px`;
  return {
    html: `<div data-node-id="${esc(node.id)}" data-node-type="shape" style="position:absolute;left:${node.x}px;top:${node.y}px;width:${node.w}px;height:${node.h}px;opacity:${node.opacity ?? style.opacity};background:${esc(style.fill)};border:${style.strokeWidth}px solid ${esc(style.stroke)};border-radius:${radius};"></div>`
  };
}

