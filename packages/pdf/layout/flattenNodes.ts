import type { RenderableDocumentV1, RenderableNodeV1 } from "../contract/renderContractV1";

export type FlattenedPageNode = {
  node: RenderableNodeV1;
  depth: number;
  parentGroupId?: string;
  orderIndex: number;
};

export function flattenNodesForPage(doc: RenderableDocumentV1, pageId: string): FlattenedPageNode[] {
  const nodes = doc.nodes.filter((node) => node.pageId === pageId);
  const byId = new Map(nodes.map((node) => [node.id, node] as const));
  const page = doc.pages.find((value) => value.id === pageId);
  const drawOrder = page?.drawOrder ?? nodes.map((node) => node.id);
  const visited = new Set<string>();
  const flattened: FlattenedPageNode[] = [];

  const visitNode = (nodeId: string, depth: number, parentGroupId: string | undefined, orderIndex: number) => {
    const node = byId.get(nodeId);
    if (!node || visited.has(nodeId)) return;
    visited.add(nodeId);
    flattened.push({ node, depth, parentGroupId, orderIndex });
    if (node.type === "group" && Array.isArray(node.childrenIds)) {
      node.childrenIds.forEach((childId, childIndex) => visitNode(childId, depth + 1, node.id, orderIndex * 1000 + childIndex));
    }
  };

  drawOrder.forEach((nodeId, index) => visitNode(nodeId, 0, undefined, index));
  for (const node of nodes) {
    if (!visited.has(node.id)) visitNode(node.id, 0, undefined, flattened.length);
  }
  return flattened;
}

