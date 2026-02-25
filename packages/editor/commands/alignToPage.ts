import type { GeometryNode, PositionPatch } from "../utils/geometry";
import { getCenterX, getCenterY } from "../utils/geometry";

export type PageRect = {
  width: number;
  height: number;
};

export type AlignToPageAction =
  | "left"
  | "centerX"
  | "right"
  | "top"
  | "centerY"
  | "bottom";

function alignNodeToPage(node: GeometryNode, page: PageRect, action: AlignToPageAction): PositionPatch {
  if (action === "left") return { id: node.id, x: 0 };
  if (action === "centerX") return { id: node.id, x: page.width / 2 - node.w / 2 };
  if (action === "right") return { id: node.id, x: page.width - node.w };
  if (action === "top") return { id: node.id, y: 0 };
  if (action === "centerY") return { id: node.id, y: page.height / 2 - node.h / 2 };
  return { id: node.id, y: page.height - node.h };
}

export function buildAlignToPagePatches(
  nodes: GeometryNode[],
  page: PageRect,
  action: AlignToPageAction
): PositionPatch[] {
  return nodes.filter((node) => !node.locked).map((node) => alignNodeToPage(node, page, action));
}

export function isAlignedToPage(node: GeometryNode, page: PageRect, action: AlignToPageAction) {
  if (action === "left") return node.x === 0;
  if (action === "centerX") return getCenterX(node) === page.width / 2;
  if (action === "right") return node.x + node.w === page.width;
  if (action === "top") return node.y === 0;
  if (action === "centerY") return getCenterY(node) === page.height / 2;
  return node.y + node.h === page.height;
}
