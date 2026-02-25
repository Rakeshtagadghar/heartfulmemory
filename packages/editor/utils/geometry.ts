import type { BoundsRect } from "../selection/computeBounds";

export type GeometryNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  locked?: boolean;
};

export type PositionPatch = {
  id: string;
  x?: number;
  y?: number;
};

export function getCenterX(node: Pick<GeometryNode, "x" | "w">) {
  return node.x + node.w / 2;
}

export function getCenterY(node: Pick<GeometryNode, "y" | "h">) {
  return node.y + node.h / 2;
}

export function patchX(id: string, x: number): PositionPatch {
  return { id, x };
}

export function patchY(id: string, y: number): PositionPatch {
  return { id, y };
}

export function patchXY(id: string, x: number, y: number): PositionPatch {
  return { id, x, y };
}

export function mergePositionPatches(...patches: PositionPatch[]): PositionPatch[] {
  const byId = new Map<string, PositionPatch>();
  for (const patch of patches) {
    const current = byId.get(patch.id);
    byId.set(patch.id, { ...(current ?? { id: patch.id }), ...patch });
  }
  return [...byId.values()];
}

export function selectionBoundsOrNull(nodes: GeometryNode[]): BoundsRect | null {
  if (nodes.length === 0) return null;
  let minX = nodes[0].x;
  let minY = nodes[0].y;
  let maxX = nodes[0].x + nodes[0].w;
  let maxY = nodes[0].y + nodes[0].h;
  for (let index = 1; index < nodes.length; index += 1) {
    const node = nodes[index];
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.w);
    maxY = Math.max(maxY, node.y + node.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
