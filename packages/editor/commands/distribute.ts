import type { GeometryNode, PositionPatch } from "../utils/geometry";

export type DistributeAction = "horizontal" | "vertical";

function buildHorizontalPatches(nodes: GeometryNode[]): PositionPatch[] {
  const movable = nodes.filter((node) => !node.locked).sort((a, b) => a.x - b.x);
  if (movable.length < 3) return [];

  const first = movable[0];
  const last = movable[movable.length - 1];
  const totalWidth = movable.reduce((sum, node) => sum + node.w, 0);
  const gap = ((last.x + last.w) - first.x - totalWidth) / Math.max(1, movable.length - 1);

  let cursor = first.x;
  return movable.map((node, index) => {
    if (index === 0) {
      cursor = node.x + node.w + gap;
      return { id: node.id, x: node.x };
    }
    if (index === movable.length - 1) {
      return { id: node.id, x: last.x };
    }
    const patch = { id: node.id, x: cursor };
    cursor += node.w + gap;
    return patch;
  });
}

function buildVerticalPatches(nodes: GeometryNode[]): PositionPatch[] {
  const movable = nodes.filter((node) => !node.locked).sort((a, b) => a.y - b.y);
  if (movable.length < 3) return [];

  const first = movable[0];
  const last = movable[movable.length - 1];
  const totalHeight = movable.reduce((sum, node) => sum + node.h, 0);
  const gap = ((last.y + last.h) - first.y - totalHeight) / Math.max(1, movable.length - 1);

  let cursor = first.y;
  return movable.map((node, index) => {
    if (index === 0) {
      cursor = node.y + node.h + gap;
      return { id: node.id, y: node.y };
    }
    if (index === movable.length - 1) {
      return { id: node.id, y: last.y };
    }
    const patch = { id: node.id, y: cursor };
    cursor += node.h + gap;
    return patch;
  });
}

export function buildDistributePatches(nodes: GeometryNode[], action: DistributeAction): PositionPatch[] {
  return action === "horizontal" ? buildHorizontalPatches(nodes) : buildVerticalPatches(nodes);
}
