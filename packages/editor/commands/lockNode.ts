export function buildLockNodePatch(locked: boolean) {
  return { locked };
}

export function toggleNodeLocked(currentLocked: boolean | null | undefined) {
  return { locked: !currentLocked };
}

