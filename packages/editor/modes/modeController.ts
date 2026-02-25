import { enterCropMode, type CropModeState, type CropTargetKind } from "./cropMode";

export type EditorModeState =
  | { kind: "select" }
  | { kind: "textEdit"; frameId: string }
  | { kind: "crop"; crop: CropModeState & { active: true } };

export const DEFAULT_EDITOR_MODE_STATE: EditorModeState = { kind: "select" };

export function startTextEditMode(frameId: string): EditorModeState {
  return { kind: "textEdit", frameId };
}

export function startCropMode(frameId: string, targetKind: CropTargetKind): EditorModeState {
  return { kind: "crop", crop: enterCropMode(frameId, targetKind) };
}

export function stopMode(): EditorModeState {
  return DEFAULT_EDITOR_MODE_STATE;
}

export function isCropEditorMode(state: EditorModeState | null | undefined): state is Extract<EditorModeState, { kind: "crop" }> {
  return state?.kind === "crop";
}
