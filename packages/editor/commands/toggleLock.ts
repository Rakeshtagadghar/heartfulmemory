export type LockPatch = { id: string; locked: boolean };

export function buildToggleLockPatch(currentLocked: boolean | null | undefined) {
  return { locked: !currentLocked };
}

export function buildToggleLockSelectionPatches<T extends { id: string; locked?: boolean }>(
  nodes: T[],
  selectedIds: string[]
): LockPatch[] {
  const selectedSet = new Set(selectedIds);
  return nodes
    .filter((node) => selectedSet.has(node.id))
    .map((node) => ({ id: node.id, locked: !node.locked }));
}
