export function isModifierPressed(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey;
}

export function isNodeCopyShortcut(event: KeyboardEvent) {
  return isModifierPressed(event) && event.key.toLowerCase() === "c";
}

export function isNodePasteShortcut(event: KeyboardEvent) {
  return isModifierPressed(event) && event.key.toLowerCase() === "v";
}

export function isNodeDuplicateShortcut(event: KeyboardEvent) {
  return isModifierPressed(event) && event.key.toLowerCase() === "d";
}

export function isNodeLockShortcut(event: KeyboardEvent) {
  return isModifierPressed(event) && event.key.toLowerCase() === "l";
}

export function isNodeBringForwardShortcut(event: KeyboardEvent) {
  return isModifierPressed(event) && event.key === "]";
}

export function isNodeSendBackwardShortcut(event: KeyboardEvent) {
  return isModifierPressed(event) && event.key === "[";
}

export function isUndoShortcut(event: KeyboardEvent) {
  return isModifierPressed(event) && !event.shiftKey && event.key.toLowerCase() === "z";
}

export function isRedoShortcut(event: KeyboardEvent) {
  return isModifierPressed(event) && event.shiftKey && event.key.toLowerCase() === "z";
}

export function isEditableTextTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
