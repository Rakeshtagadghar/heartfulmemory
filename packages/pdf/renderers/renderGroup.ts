import { normalizeGridGroupContentV1, normalizeGroupNodeStyleV1 } from "../../editor/nodes/groupNode";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderGroupNode(node: {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  style?: Record<string, unknown>;
  content?: Record<string, unknown>;
}) {
  const style = normalizeGroupNodeStyleV1(node.style);
  const content = normalizeGridGroupContentV1(node.content);
  const cols = content.columns;
  const rows = content.rows;
  const cells =
    content.cells && content.cells.length > 0
      ? content.cells
      : Array.from({ length: cols * rows }, (_, index) => ({
          id: `grid-cell-${index + 1}`,
          row: Math.floor(index / cols),
          col: index % cols,
          rowSpan: 1,
          colSpan: 1
        }));

  const cellHtml = cells
    .map(
      (cell) => `<div data-cell-id="${esc(cell.id)}" style="border:${style.strokeWidth}px dashed ${esc(style.stroke)};background:${esc(
        style.cellFill
      )};border-radius:8px;grid-column:${cell.col + 1} / span ${cell.colSpan ?? 1};grid-row:${cell.row + 1} / span ${
        cell.rowSpan ?? 1
      };"></div>`
    )
    .join("");

  return {
    html: `<div data-node-id="${esc(node.id)}" data-node-type="group" style="position:absolute;left:${node.x}px;top:${node.y}px;width:${node.w}px;height:${node.h}px;opacity:${node.opacity ?? style.opacity};padding:${content.padding}px;"><div style="display:grid;width:100%;height:100%;gap:${content.gap}px;grid-template-columns:repeat(${cols}, minmax(0,1fr));grid-template-rows:repeat(${rows}, minmax(0,1fr));">${cellHtml}</div></div>`
  };
}

