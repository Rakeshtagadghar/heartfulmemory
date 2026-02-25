export type NodeMenuActionId =
  | "copy"
  | "paste"
  | "duplicate"
  | "delete"
  | "lock"
  | "unlock"
  | "bringForward"
  | "sendBackward"
  | "bringToFront"
  | "sendToBack"
  | "alignPageLeft"
  | "alignPageCenterX"
  | "alignPageRight"
  | "alignPageTop"
  | "alignPageCenterY"
  | "alignPageBottom"
  | "alignSelectionLeft"
  | "alignSelectionCenterX"
  | "alignSelectionRight"
  | "alignSelectionTop"
  | "alignSelectionCenterY"
  | "alignSelectionBottom"
  | "distributeHorizontal"
  | "distributeVertical"
  | "replaceImage";

export type NodeMenuAction = {
  id: NodeMenuActionId;
  label: string;
  danger?: boolean;
  disabled?: boolean;
};

export function getLayerActions(disabled = false): NodeMenuAction[] {
  return [
    { id: "bringForward", label: "Bring forward", disabled },
    { id: "sendBackward", label: "Send backward", disabled },
    { id: "bringToFront", label: "Bring to front", disabled },
    { id: "sendToBack", label: "Send to back", disabled }
  ];
}

export function getAlignPageActions(disabled = false): NodeMenuAction[] {
  return [
    { id: "alignPageLeft", label: "Left", disabled },
    { id: "alignPageCenterX", label: "Center horizontally", disabled },
    { id: "alignPageRight", label: "Right", disabled },
    { id: "alignPageTop", label: "Top", disabled },
    { id: "alignPageCenterY", label: "Middle", disabled },
    { id: "alignPageBottom", label: "Bottom", disabled }
  ];
}

export function getAlignSelectionActions(disabled = false): NodeMenuAction[] {
  return [
    { id: "alignSelectionLeft", label: "Left", disabled },
    { id: "alignSelectionCenterX", label: "Center horizontally", disabled },
    { id: "alignSelectionRight", label: "Right", disabled },
    { id: "alignSelectionTop", label: "Top", disabled },
    { id: "alignSelectionCenterY", label: "Middle", disabled },
    { id: "alignSelectionBottom", label: "Bottom", disabled }
  ];
}
