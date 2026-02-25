import {
  normalizeCropModelV1,
  serializeCropModelV1,
  type CropModeKind
} from "../../models/cropModel";

export function migrateCropToV1(
  crop: Record<string, unknown> | null | undefined,
  options?: { mode?: CropModeKind; objectFit?: "cover" | "contain" }
) {
  return serializeCropModelV1(
    normalizeCropModelV1(crop, {
      mode: options?.mode,
      objectFit: options?.objectFit
    })
  );
}
