export type SelectableNode = {
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function getSelectedNodes<T extends SelectableNode>(nodes: T[], selectedIds: string[]) {
  if (selectedIds.length === 0) return [];
  const selectedSet = new Set(selectedIds);
  return nodes.filter((node) => selectedSet.has(node.id));
}

export function getUnlockedSelectedNodes<T extends SelectableNode>(nodes: T[], selectedIds: string[]) {
  return getSelectedNodes(nodes, selectedIds).filter((node) => !node.locked);
}

export function isMultiSelection(selectedIds: string[]) {
  return selectedIds.length >= 2;
}

export function isDistributionEligible(nodes: SelectableNode[]) {
  return nodes.filter((node) => !node.locked).length >= 3;
}
