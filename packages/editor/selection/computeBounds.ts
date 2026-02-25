export type BoundsRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type BoundsNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function computeSelectionBounds(nodes: BoundsNode[]): BoundsRect | null {
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

  return {
    x: minX,
    y: minY,
    w: Math.max(0, maxX - minX),
    h: Math.max(0, maxY - minY)
  };
}
