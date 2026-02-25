import type { BoundsRect } from "../selection/computeBounds";
import type { GeometryNode, PositionPatch } from "../utils/geometry";

export type AlignToSelectionAction =
  | "left"
  | "centerX"
  | "right"
  | "top"
  | "centerY"
  | "bottom";

function alignNodeToBounds(node: GeometryNode, bounds: BoundsRect, action: AlignToSelectionAction): PositionPatch {
  if (action === "left") return { id: node.id, x: bounds.x };
  if (action === "centerX") return { id: node.id, x: bounds.x + bounds.w / 2 - node.w / 2 };
  if (action === "right") return { id: node.id, x: bounds.x + bounds.w - node.w };
  if (action === "top") return { id: node.id, y: bounds.y };
  if (action === "centerY") return { id: node.id, y: bounds.y + bounds.h / 2 - node.h / 2 };
  return { id: node.id, y: bounds.y + bounds.h - node.h };
}

export function buildAlignToSelectionPatches(
  nodes: GeometryNode[],
  bounds: BoundsRect | null,
  action: AlignToSelectionAction
): PositionPatch[] {
  if (!bounds || nodes.length < 2) return [];
  return nodes.filter((node) => !node.locked).map((node) => alignNodeToBounds(node, bounds, action));
}
