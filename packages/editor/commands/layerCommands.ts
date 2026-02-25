function uniqueSelectedInDrawOrder(drawOrder: string[], selectedIds: string[]) {
  const selectedSet = new Set(selectedIds);
  return drawOrder.filter((id) => selectedSet.has(id));
}

function reorderPreservingRelative(drawOrder: string[], selectedIds: string[], targetIndex: number) {
  const selectedOrdered = uniqueSelectedInDrawOrder(drawOrder, selectedIds);
  if (selectedOrdered.length === 0) return drawOrder;

  const selectedSet = new Set(selectedOrdered);
  const remaining = drawOrder.filter((id) => !selectedSet.has(id));
  const clampedIndex = Math.max(0, Math.min(targetIndex, remaining.length));
  return [
    ...remaining.slice(0, clampedIndex),
    ...selectedOrdered,
    ...remaining.slice(clampedIndex)
  ];
}

export function bringToFront(drawOrder: string[], selectedIds: string[]) {
  return reorderPreservingRelative(drawOrder, selectedIds, drawOrder.length);
}

export function sendToBack(drawOrder: string[], selectedIds: string[]) {
  return reorderPreservingRelative(drawOrder, selectedIds, 0);
}

export function bringForward(drawOrder: string[], selectedIds: string[]) {
  const selectedOrdered = uniqueSelectedInDrawOrder(drawOrder, selectedIds);
  if (selectedOrdered.length === 0) return drawOrder;
  const lastSelected = selectedOrdered[selectedOrdered.length - 1];
  const lastIndex = drawOrder.indexOf(lastSelected);
  if (lastIndex < 0 || lastIndex === drawOrder.length - 1) return drawOrder;
  return reorderPreservingRelative(drawOrder, selectedIds, lastIndex + 2 - selectedOrdered.length);
}

export function sendBackward(drawOrder: string[], selectedIds: string[]) {
  const selectedOrdered = uniqueSelectedInDrawOrder(drawOrder, selectedIds);
  if (selectedOrdered.length === 0) return drawOrder;
  const firstSelected = selectedOrdered[0];
  const firstIndex = drawOrder.indexOf(firstSelected);
  if (firstIndex <= 0) return drawOrder;
  return reorderPreservingRelative(drawOrder, selectedIds, firstIndex - 1);
}
