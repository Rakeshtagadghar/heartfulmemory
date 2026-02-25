export type CropTargetKind = "IMAGE" | "FRAME";

export type CropModeSession = {
  active: true;
  frameId: string;
  targetKind: CropTargetKind;
  openedAt: number;
};

export type CropModeState = CropModeSession | { active: false };

export const INACTIVE_CROP_MODE_STATE: CropModeState = { active: false };

export function enterCropMode(frameId: string, targetKind: CropTargetKind): CropModeSession {
  return {
    active: true,
    frameId,
    targetKind,
    openedAt: Date.now()
  };
}

export function exitCropMode(): CropModeState {
  return INACTIVE_CROP_MODE_STATE;
}

export function isCropModeActive(state: CropModeState | null | undefined): state is CropModeSession {
  return Boolean(state?.active);
}

export function canEnterCropModeFromSelection(selectionCount: number, frameType: string | null | undefined) {
  if (selectionCount !== 1) return false;
  return frameType === "IMAGE" || frameType === "FRAME";
}
