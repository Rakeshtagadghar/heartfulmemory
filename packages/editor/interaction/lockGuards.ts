export type LockableNode = {
  id: string;
  type: string;
  locked?: boolean;
};

export function isLockedNode(node: LockableNode | null | undefined) {
  return Boolean(node?.locked);
}

export function canMoveNode(node: LockableNode | null | undefined) {
  return Boolean(node) && !isLockedNode(node);
}

export function canResizeNode(node: LockableNode | null | undefined) {
  return canMoveNode(node);
}

export function canEnterTextEdit(node: LockableNode | null | undefined) {
  return Boolean(node) && node?.type === "TEXT" && !isLockedNode(node);
}

export function canEnterCropMode(node: LockableNode | null | undefined) {
  if (!node || isLockedNode(node)) return false;
  return node.type === "IMAGE" || node.type === "FRAME";
}

export function filterUnlockedNodes<T extends LockableNode>(nodes: T[]) {
  return nodes.filter((node) => !isLockedNode(node));
}
