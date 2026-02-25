import { updateCropRotationV1 } from "../models/cropModel";

export function buildCropRotationPatch(
  crop: Record<string, unknown> | null | undefined,
  deltaDeg: number
) {
  const currentRotation = typeof crop?.rotationDeg === "number" ? crop.rotationDeg : 0;
  return updateCropRotationV1(crop, currentRotation + deltaDeg);
}
