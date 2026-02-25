export type LayerNodeLike = {
  id: string;
  z_index?: number;
};

export function buildDrawOrderFromNodes(nodes: LayerNodeLike[]) {
  return [...nodes]
    .sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0))
    .map((node) => node.id);
}

export function normalizeDrawOrder(nodeIds: string[], drawOrder: string[] | null | undefined) {
  const known = new Set(nodeIds);
  const next: string[] = [];
  for (const id of drawOrder ?? []) {
    if (known.has(id) && !next.includes(id)) next.push(id);
  }
  for (const id of nodeIds) {
    if (!next.includes(id)) next.push(id);
  }
  return next;
}

export function drawOrderToZIndexPatches(drawOrder: string[]) {
  return drawOrder.map((id, z_index) => ({ id, z_index }));
}
