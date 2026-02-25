import { computeSelectionBounds, type BoundsNode, type BoundsRect } from "./computeBounds";

export type SelectionType = "single" | "multi" | "group";

export type SelectionState = {
  selectedIds: string[];
  primaryId: string | null;
  selectionType: SelectionType;
  bounds: BoundsRect | null;
};

export const EMPTY_SELECTION_STATE: SelectionState = {
  selectedIds: [],
  primaryId: null,
  selectionType: "single",
  bounds: null
};

function dedupeIds(ids: string[]) {
  return [...new Set(ids.filter((id) => id.length > 0))];
}

function deriveSelectionType(selectedIds: string[]): SelectionType {
  return selectedIds.length > 1 ? "multi" : "single";
}

export function buildSelectionState(input: {
  selectedIds: string[];
  primaryId?: string | null;
  nodes?: BoundsNode[];
  selectionType?: SelectionType;
}): SelectionState {
  const selectedIds = dedupeIds(input.selectedIds);
  const primaryId =
    input.primaryId && selectedIds.includes(input.primaryId)
      ? input.primaryId
      : (selectedIds[0] ?? null);

  return {
    selectedIds,
    primaryId,
    selectionType: input.selectionType ?? deriveSelectionType(selectedIds),
    bounds: input.nodes ? computeSelectionBounds(input.nodes) : null
  };
}

export function selectSingle(id: string, node?: BoundsNode | null): SelectionState {
  return buildSelectionState({
    selectedIds: id ? [id] : [],
    primaryId: id || null,
    nodes: node ? [node] : []
  });
}

export function clearSelection(): SelectionState {
  return EMPTY_SELECTION_STATE;
}

export function toggleSelectionId(current: SelectionState, id: string): SelectionState {
  if (!id) return current;
  const selectedIds = current.selectedIds.includes(id)
    ? current.selectedIds.filter((item) => item !== id)
    : [...current.selectedIds, id];

  return {
    ...current,
    selectedIds,
    primaryId: selectedIds.includes(current.primaryId ?? "") ? current.primaryId : (selectedIds[0] ?? null),
    selectionType: deriveSelectionType(selectedIds),
    bounds: current.bounds
  };
}

export function withSelectionBounds(current: SelectionState, nodes: BoundsNode[]): SelectionState {
  return {
    ...current,
    bounds: computeSelectionBounds(nodes)
  };
}
